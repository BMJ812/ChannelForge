import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import { AuditRecordId } from './AuditRecordId.js';
import { SqliteAuditSink } from './SqliteAuditSink.js';

describe('SqliteAuditSink', () => {
  it('appends immutable audit evidence with branded identity', () => {
    const database = new Database(':memory:');

    try {
      database.pragma('foreign_keys = ON');

      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const sink = new SqliteAuditSink(database);

      const record = sink.append({
        actorType: 'system',
        action: 'migration.preflight',
        targetType: 'database',
        targetId: 'primary',
        outcome: 'SUCCESS',
        correlationId: 'corr-001',
        details: {
          backupVerified: true,
        },
        now: () => new Date('2026-08-19T01:00:00.000Z'),
      });

      expect(AuditRecordId.parse(record.auditRecordId)).toBe(
        record.auditRecordId,
      );

      const row = database
        .prepare(
          `
              SELECT
                action,
                outcome,
                details_json
              FROM cf_audit_record
              WHERE audit_record_id = ?
            `,
        )
        .get(record.auditRecordId) as {
        action: string;
        outcome: string;
        details_json: string;
      };

      expect(row.action).toBe('migration.preflight');

      expect(row.outcome).toBe('SUCCESS');

      expect(JSON.parse(row.details_json)).toEqual({
        backupVerified: true,
      });
    } finally {
      database.close();
    }
  });
});
