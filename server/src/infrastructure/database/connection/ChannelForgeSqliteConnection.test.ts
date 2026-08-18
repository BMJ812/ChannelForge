import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_SQLITE_BUSY_TIMEOUT_MS,
  openChannelForgeSqliteConnection,
} from './ChannelForgeSqliteConnection.js';

const createdDirectories: string[] = [];

function createDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-sqlite-'));

  createdDirectories.push(directory);

  return join(directory, 'channelforge.sqlite');
}

afterEach(() => {
  for (const directory of createdDirectories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('ChannelForge SQLite connection', () => {
  it('enables and verifies required connection pragmas', () => {
    const database = openChannelForgeSqliteConnection(createDatabasePath());

    try {
      expect(
        Number(
          database.pragma('foreign_keys', {
            simple: true,
          }),
        ),
      ).toBe(1);

      expect(
        Number(
          database.pragma('busy_timeout', {
            simple: true,
          }),
        ),
      ).toBe(DEFAULT_SQLITE_BUSY_TIMEOUT_MS);

      expect(
        String(
          database.pragma('journal_mode', {
            simple: true,
          }),
        ).toLowerCase(),
      ).toBe('wal');
    } finally {
      database.close();
    }
  });

  it('actually enforces foreign keys', () => {
    const database = openChannelForgeSqliteConnection(createDatabasePath());

    try {
      database.exec(`
        CREATE TABLE parent (
          id TEXT PRIMARY KEY
        );

        CREATE TABLE child (
          id TEXT PRIMARY KEY,
          parent_id TEXT NOT NULL,
          FOREIGN KEY (parent_id)
            REFERENCES parent (id)
        );
      `);

      expect(() =>
        database
          .prepare(
            `
            INSERT INTO child (
              id,
              parent_id
            )
            VALUES (?, ?)
          `,
          )
          .run('child-1', 'missing-parent'),
      ).toThrow();
    } finally {
      database.close();
    }
  });

  it('supports an explicit busy timeout', () => {
    const database = openChannelForgeSqliteConnection(createDatabasePath(), {
      busyTimeoutMs: 1_250,
    });

    try {
      expect(
        Number(
          database.pragma('busy_timeout', {
            simple: true,
          }),
        ),
      ).toBe(1_250);
    } finally {
      database.close();
    }
  });

  it('rejects an invalid busy timeout before use', () => {
    expect(() =>
      openChannelForgeSqliteConnection(createDatabasePath(), {
        busyTimeoutMs: -1,
      }),
    ).toThrow(RangeError);
  });
});
