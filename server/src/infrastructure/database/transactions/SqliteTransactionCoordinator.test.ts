import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import {
  NestedTransactionError,
  SqliteTransactionCoordinator,
} from './SqliteTransactionCoordinator.js';

describe('SqliteTransactionCoordinator', () => {
  it('commits successful writes', () => {
    const database = new Database(':memory:');

    try {
      database.exec(`
        CREATE TABLE value (
          id INTEGER PRIMARY KEY,
          text TEXT NOT NULL
        )
      `);

      const coordinator = new SqliteTransactionCoordinator(database);

      coordinator.run(() => {
        database
          .prepare(
            `
              INSERT INTO value (
                id,
                text
              )
              VALUES (1, 'committed')
            `,
          )
          .run();
      });

      const row = database
        .prepare(
          `
            SELECT text
            FROM value
            WHERE id = 1
          `,
        )
        .get() as {
        text: string;
      };

      expect(row.text).toBe('committed');
    } finally {
      database.close();
    }
  });

  it('rolls back failed writes', () => {
    const database = new Database(':memory:');

    try {
      database.exec(`
        CREATE TABLE value (
          id INTEGER PRIMARY KEY,
          text TEXT NOT NULL
        )
      `);

      const coordinator = new SqliteTransactionCoordinator(database);

      expect(() =>
        coordinator.run(() => {
          database
            .prepare(
              `
                INSERT INTO value (
                  id,
                  text
                )
                VALUES (
                  1,
                  'rolled back'
                )
              `,
            )
            .run();

          throw new Error('fail');
        }),
      ).toThrow('fail');

      const count = database
        .prepare(
          `
            SELECT COUNT(*) AS count
            FROM value
          `,
        )
        .get() as {
        count: number;
      };

      expect(count.count).toBe(0);
    } finally {
      database.close();
    }
  });

  it('rejects hidden nested transactions', () => {
    const database = new Database(':memory:');

    try {
      const coordinator = new SqliteTransactionCoordinator(database);

      expect(() =>
        coordinator.run(() => coordinator.run(() => undefined)),
      ).toThrow(NestedTransactionError);
    } finally {
      database.close();
    }
  });
});
