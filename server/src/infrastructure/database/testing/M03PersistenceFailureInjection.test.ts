import { mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import Database from 'better-sqlite3';

import { afterEach, describe, expect, it } from 'vitest';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';

import { SqliteIntegrityVerifier } from '../integrity/SqliteIntegrityVerifier.js';

import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(
    join(tmpdir(), 'channelforge-failure-injection-'),
  );

  directories.push(directory);

  return join(directory, 'database.sqlite');
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

function sqliteCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(
      (
        error as {
          code?: unknown;
        }
      ).code,
    );
  }

  return '';
}

describe('M03 persistence failure injection', () => {
  it('rolls back a transaction when SQLite reports disk full and preserves integrity', () => {
    const filename = createFilename();

    const database = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      database.exec(`
        CREATE TABLE m03_disk_full_probe (
          id INTEGER PRIMARY KEY,
          payload BLOB NOT NULL
        );
      `);

      const pageCount = Number(
        database.pragma('page_count', {
          simple: true,
        }),
      );

      const maxPageCount = pageCount + 1;

      database.pragma(`max_page_count = ${maxPageCount}`);

      let captured: unknown;

      try {
        database
          .transaction(() => {
            database
              .prepare(
                `
                    INSERT INTO m03_disk_full_probe (
                      payload
                    )
                    VALUES (
                      zeroblob(?)
                    )
                  `,
              )
              .run(8 * 1024 * 1024);
          })
          .immediate();
      } catch (error) {
        captured = error;
      }

      expect(sqliteCode(captured)).toBe('SQLITE_FULL');

      const count = database
        .prepare(
          `
              SELECT
                COUNT(*) AS count
              FROM m03_disk_full_probe
            `,
        )
        .get() as {
        count: number;
      };

      expect(count.count).toBe(0);

      expect(new SqliteIntegrityVerifier(database).runQuickCheck().status).toBe(
        'PASSED',
      );
    } finally {
      database.close();
    }
  });

  it('classifies a write attempt through a read-only connection as SQLITE_READONLY', () => {
    const filename = createFilename();

    const writable = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        writable,
        channelForgeSchemaMigrations,
      ).migrate();

      writable.exec(`
        CREATE TABLE m03_permission_probe (
          value TEXT NOT NULL
        );
      `);
    } finally {
      writable.close();
    }

    const readonly = new Database(filename, {
      readonly: true,
    });

    try {
      let captured: unknown;

      try {
        readonly
          .prepare(
            `
              INSERT INTO m03_permission_probe (
                value
              )
              VALUES (
                'denied'
              )
            `,
          )
          .run();
      } catch (error) {
        captured = error;
      }

      expect(sqliteCode(captured).startsWith('SQLITE_READONLY')).toBe(true);

      expect(
        readonly
          .prepare(
            `
              SELECT
                COUNT(*) AS count
              FROM m03_permission_probe
            `,
          )
          .get(),
      ).toEqual({
        count: 0,
      });
    } finally {
      readonly.close();
    }
  });
});
