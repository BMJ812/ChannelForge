import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { SqliteIntegrityVerifier } from './SqliteIntegrityVerifier.js';

describe('SqliteIntegrityVerifier', () => {
  it('passes a healthy SQLite database', () => {
    const database = new Database(':memory:');

    try {
      database.pragma('foreign_keys = ON');

      database.exec(`
        CREATE TABLE parent (
          id INTEGER PRIMARY KEY
        );

        CREATE TABLE child (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER NOT NULL,
          FOREIGN KEY (parent_id)
            REFERENCES parent (id)
        );

        INSERT INTO parent (id)
        VALUES (1);

        INSERT INTO child (
          id,
          parent_id
        )
        VALUES (
          1,
          1
        );
      `);

      const result = new SqliteIntegrityVerifier(database).runQuickCheck();

      expect(result.status).toBe('PASSED');

      expect(result.quickCheck).toEqual(['ok']);

      expect(result.foreignKeyViolations).toEqual([]);
    } finally {
      database.close();
    }
  });

  it('detects foreign-key corruption', () => {
    const database = new Database(':memory:');

    try {
      database.pragma('foreign_keys = OFF');

      database.exec(`
        CREATE TABLE parent (
          id INTEGER PRIMARY KEY
        );

        CREATE TABLE child (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER NOT NULL,
          FOREIGN KEY (parent_id)
            REFERENCES parent (id)
        );

        INSERT INTO child (
          id,
          parent_id
        )
        VALUES (
          1,
          999
        );
      `);

      database.pragma('foreign_keys = ON');

      const result = new SqliteIntegrityVerifier(database).runQuickCheck();

      expect(result.status).toBe('FAILED');

      expect(result.quickCheck).toEqual(['ok']);

      expect(result.foreignKeyViolations).toHaveLength(1);

      expect(result.errorSummary).toContain('foreign_key_violations=1');
    } finally {
      database.close();
    }
  });
});
