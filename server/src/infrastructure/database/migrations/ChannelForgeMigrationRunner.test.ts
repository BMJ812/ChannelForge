import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import {
  ChannelForgeMigrationRunner,
  MigrationChecksumMismatchError,
} from './ChannelForgeMigrationRunner.js';
import {
  checksumSchemaMigration,
  type SchemaMigration,
} from './SchemaMigration.js';
import { channelForgeSchemaMigrations } from './migrations/index.js';

const createdDirectories: string[] = [];

function openTestDatabase() {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-migration-'));

  createdDirectories.push(directory);

  return openChannelForgeSqliteConnection(
    join(directory, 'channelforge.sqlite'),
  );
}

afterEach(() => {
  for (const directory of createdDirectories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('ChannelForgeMigrationRunner', () => {
  it('creates migration infrastructure and applies every registered migration', () => {
    const database = openTestDatabase();

    try {
      const runner = new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
        {
          applicationVersion: 'test-version',
          baselineCommit: 'test-commit',
        },
      );

      const expectedMigrationIds = channelForgeSchemaMigrations.map(
        (migration) => migration.id,
      );

      const result = runner.migrate();

      expect(result.applied).toEqual(expectedMigrationIds);

      const tables = database
        .prepare(
          `
            SELECT name
            FROM sqlite_master
            WHERE
              type = 'table'
              AND name LIKE 'cf_%'
            ORDER BY name ASC
          `,
        )
        .all() as Array<{
        name: string;
      }>;

      const tableNames = tables.map((row) => row.name);

      expect(tableNames).toEqual(
        expect.arrayContaining([
          'cf_migration_checkpoint',
          'cf_migration_conflict',
          'cf_migration_run',
          'cf_migration_step',
          'cf_schema_migration',
        ]),
      );

      expect(database.pragma('foreign_key_check')).toEqual([]);

      expect(
        runner.listMigrations().map((migration) => migration.migrationId),
      ).toEqual(expectedMigrationIds);
    } finally {
      database.close();
    }
  });

  it('is idempotent for the complete registered migration set', () => {
    const database = openTestDatabase();

    try {
      const runner = new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      );

      const expectedMigrationIds = channelForgeSchemaMigrations.map(
        (migration) => migration.id,
      );

      runner.migrate();

      const second = runner.migrate();

      expect(second.applied).toEqual([]);

      expect(second.alreadyApplied).toEqual(expectedMigrationIds);

      const count = database
        .prepare(
          `
            SELECT COUNT(*) AS count
            FROM cf_schema_migration
          `,
        )
        .get() as {
        count: number;
      };

      expect(count.count).toBe(expectedMigrationIds.length);
    } finally {
      database.close();
    }
  });
  it('rejects a modified migration after it has been applied', () => {
    const database = openTestDatabase();

    const original: SchemaMigration = {
      id: '9000_checksum_test',
      name: 'Checksum test',
      statements: [
        `
          CREATE TABLE checksum_test (
            id TEXT PRIMARY KEY
          )
        `,
      ],
    };

    const modified: SchemaMigration = {
      ...original,
      statements: [
        `
          CREATE TABLE checksum_test (
            id TEXT PRIMARY KEY,
            changed TEXT
          )
        `,
      ],
    };

    try {
      new ChannelForgeMigrationRunner(database, [original]).migrate();

      expect(() =>
        new ChannelForgeMigrationRunner(database, [modified]).migrate(),
      ).toThrow(MigrationChecksumMismatchError);
    } finally {
      database.close();
    }
  });

  it('records a failed migration durably', () => {
    const database = openTestDatabase();

    const broken: SchemaMigration = {
      id: '9001_failure_test',
      name: 'Failure test',
      statements: [
        `
          CREATE TABLE should_roll_back (
            id TEXT PRIMARY KEY
          )
        `,
        'THIS IS NOT VALID SQLITE',
      ],
    };

    try {
      expect(() =>
        new ChannelForgeMigrationRunner(database, [broken]).migrate(),
      ).toThrow();

      const migration = database
        .prepare(
          `
            SELECT
              status,
              failed_at,
              error_summary
            FROM cf_schema_migration
            WHERE migration_id = ?
          `,
        )
        .get(broken.id) as {
        status: string;
        failed_at: string | null;
        error_summary: string | null;
      };

      expect(migration.status).toBe('FAILED');
      expect(migration.failed_at).not.toBeNull();
      expect(migration.error_summary).not.toBeNull();

      const rolledBackTable = database
        .prepare(
          `
            SELECT name
            FROM sqlite_master
            WHERE
              type = 'table'
              AND name = 'should_roll_back'
          `,
        )
        .get();

      expect(rolledBackTable).toBeUndefined();
    } finally {
      database.close();
    }
  });

  it('recovers an incomplete RUNNING migration by retrying the restart-safe migration', () => {
    const database = openTestDatabase();

    const migration: SchemaMigration = {
      id: '9002_restart_test',
      name: 'Restart test',
      statements: [
        `
          CREATE TABLE IF NOT EXISTS
            restart_test (
              id TEXT PRIMARY KEY
            )
        `,
      ],
    };

    try {
      new ChannelForgeMigrationRunner(database, []).migrate();

      database
        .prepare(
          `
            INSERT INTO cf_schema_migration (
              migration_id,
              migration_name,
              checksum,
              status,
              started_at
            )
            VALUES (?, ?, ?, 'RUNNING', ?)
          `,
        )
        .run(
          migration.id,
          migration.name,
          checksumSchemaMigration(migration),
          new Date().toISOString(),
        );

      const result = new ChannelForgeMigrationRunner(database, [
        migration,
      ]).migrate();

      expect(result.applied).toEqual([migration.id]);

      const row = database
        .prepare(
          `
            SELECT status
            FROM cf_schema_migration
            WHERE migration_id = ?
          `,
        )
        .get(migration.id) as {
        status: string;
      };

      expect(row.status).toBe('APPLIED');
    } finally {
      database.close();
    }
  });
});
