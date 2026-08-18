import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import {
  BackupPreflightIntegrityError,
  BackupSourceUnavailableError,
  ChannelForgeBackupPreflightService,
} from './ChannelForgeBackupPreflightService.js';

const directories: string[] = [];

function createDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-backup-'));

  directories.push(directory);

  return directory;
}

function openMigratedDatabase(filename: string) {
  const database = openChannelForgeSqliteConnection(filename);

  new ChannelForgeMigrationRunner(
    database,
    channelForgeSchemaMigrations,
  ).migrate();

  return database;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('ChannelForgeBackupPreflightService', () => {
  it('creates and verifies a filesystem SQLite backup', async () => {
    const directory = createDirectory();

    const sourcePath = join(directory, 'source.sqlite');

    const backupDirectory = join(directory, 'backups');

    const database = openMigratedDatabase(sourcePath);

    try {
      database.exec(`
        CREATE TABLE backup_probe (
          id INTEGER PRIMARY KEY,
          value TEXT NOT NULL
        );

        INSERT INTO backup_probe (
          id,
          value
        )
        VALUES (
          1,
          'survives-backup'
        );
      `);

      const service = new ChannelForgeBackupPreflightService(database);

      const result = await service.createVerifiedBackup({
        backupDirectory,
        applicationVersion: 'test-version',
        schemaVersion: 3,
        createdBy: 'test-suite',
        now: () => new Date('2026-08-18T10:00:00.000Z'),
      });

      expect(result.verificationStatus).toBe('VERIFIED');

      expect(existsSync(result.backupPath)).toBe(true);

      expect(existsSync(result.manifestPath)).toBe(true);

      expect(result.checksum).toMatch(/^[0-9a-f]{64}$/);

      const backupRecord = database
        .prepare(
          `
              SELECT
                verification_status,
                checksum,
                checksum_algorithm,
                verified_at
              FROM cf_backup_record
              WHERE backup_id = ?
            `,
        )
        .get(result.backupId) as {
        verification_status: string;
        checksum: string;
        checksum_algorithm: string;
        verified_at: string | null;
      };

      expect(backupRecord.verification_status).toBe('VERIFIED');

      expect(backupRecord.checksum).toBe(result.checksum);

      expect(backupRecord.checksum_algorithm).toBe('sha256');

      expect(backupRecord.verified_at).not.toBeNull();

      const integrityRows = database
        .prepare(
          `
              SELECT
                target_type,
                status
              FROM cf_integrity_check
              ORDER BY target_type ASC
            `,
        )
        .all() as Array<{
        target_type: string;
        status: string;
      }>;

      expect(integrityRows).toEqual([
        {
          target_type: 'BACKUP_DATABASE',
          status: 'PASSED',
        },
        {
          target_type: 'SOURCE_DATABASE',
          status: 'PASSED',
        },
      ]);

      const manifest = JSON.parse(
        readFileSync(result.manifestPath, 'utf8'),
      ) as {
        verificationStatus: string;
        databaseChecksum: string;
        managedAssets: unknown[];
        schemaVersion: number;
      };

      expect(manifest.verificationStatus).toBe('VERIFIED');

      expect(manifest.databaseChecksum).toBe(result.checksum);

      expect(manifest.managedAssets).toEqual([]);

      expect(manifest.schemaVersion).toBe(3);

      const backupDatabase = new Database(result.backupPath, {
        readonly: true,
        fileMustExist: true,
      });

      try {
        const probe = backupDatabase
          .prepare(
            `
                SELECT value
                FROM backup_probe
                WHERE id = 1
              `,
          )
          .get() as {
          value: string;
        };

        expect(probe.value).toBe('survives-backup');

        expect(
          backupDatabase.pragma('quick_check', {
            simple: true,
          }),
        ).toBe('ok');

        expect(backupDatabase.pragma('foreign_key_check')).toEqual([]);
      } finally {
        backupDatabase.close();
      }
    } finally {
      database.close();
    }
  });

  it('blocks backup when source foreign-key integrity fails', async () => {
    const directory = createDirectory();

    const database = openMigratedDatabase(join(directory, 'source.sqlite'));

    try {
      database.pragma('foreign_keys = OFF');

      database.exec(`
        CREATE TABLE corrupt_parent (
          id INTEGER PRIMARY KEY
        );

        CREATE TABLE corrupt_child (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER NOT NULL,
          FOREIGN KEY (parent_id)
            REFERENCES corrupt_parent (id)
        );

        INSERT INTO corrupt_child (
          id,
          parent_id
        )
        VALUES (
          1,
          999
        );
      `);

      database.pragma('foreign_keys = ON');

      const service = new ChannelForgeBackupPreflightService(database);

      await expect(
        service.createVerifiedBackup({
          backupDirectory: join(directory, 'backups'),
          applicationVersion: 'test-version',
          schemaVersion: 3,
        }),
      ).rejects.toThrow(BackupPreflightIntegrityError);

      const failedCheck = database
        .prepare(
          `
              SELECT
                status,
                target_type,
                foreign_key_violation_count
              FROM cf_integrity_check
              ORDER BY checked_at DESC
              LIMIT 1
            `,
        )
        .get() as {
        status: string;
        target_type: string;
        foreign_key_violation_count: number;
      };

      expect(failedCheck.status).toBe('FAILED');

      expect(failedCheck.target_type).toBe('SOURCE_DATABASE');

      expect(failedCheck.foreign_key_violation_count).toBe(1);

      const backupCount = database
        .prepare(
          `
              SELECT COUNT(*) AS count
              FROM cf_backup_record
            `,
        )
        .get() as {
        count: number;
      };

      expect(backupCount.count).toBe(0);
    } finally {
      database.close();
    }
  });

  it('rejects an in-memory database as a backup source', async () => {
    const database = new Database(':memory:');

    try {
      const service = new ChannelForgeBackupPreflightService(database);

      await expect(
        service.createVerifiedBackup({
          backupDirectory: createDirectory(),
          applicationVersion: 'test-version',
          schemaVersion: 3,
        }),
      ).rejects.toThrow(BackupSourceUnavailableError);
    } finally {
      database.close();
    }
  });
});
