import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import {
  IdempotencyConflictError,
  IdempotencyStateError,
  SqliteIdempotencyStore,
} from './SqliteIdempotencyStore.js';

const requestHashA =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const requestHashB =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

describe('SqliteIdempotencyStore', () => {
  it('replays the same key and request hash', () => {
    const database = new Database(':memory:');

    try {
      database.pragma('foreign_keys = ON');

      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const store = new SqliteIdempotencyStore(database);

      const first = store.begin({
        scope: 'migration-start',
        actorId: 'system',
        idempotencyKey: 'start-001',
        requestHash: requestHashA,
        now: () => new Date('2026-08-19T01:01:00.000Z'),
      });

      const second = store.begin({
        scope: 'migration-start',
        actorId: 'system',
        idempotencyKey: 'start-001',
        requestHash: requestHashA,
      });

      expect(first.kind).toBe('STARTED');

      expect(second.kind).toBe('REPLAY');

      expect(second.record.createdAt).toBe(first.record.createdAt);
    } finally {
      database.close();
    }
  });

  it('rejects the same key with a different request hash', () => {
    const database = new Database(':memory:');

    try {
      database.pragma('foreign_keys = ON');

      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const store = new SqliteIdempotencyStore(database);

      store.begin({
        scope: 'migration-start',
        actorId: 'system',
        idempotencyKey: 'start-001',
        requestHash: requestHashA,
      });

      expect(() =>
        store.begin({
          scope: 'migration-start',
          actorId: 'system',
          idempotencyKey: 'start-001',
          requestHash: requestHashB,
        }),
      ).toThrow(IdempotencyConflictError);
    } finally {
      database.close();
    }
  });

  it('persists completed results and blocks a second terminal transition', () => {
    const database = new Database(':memory:');

    try {
      database.pragma('foreign_keys = ON');

      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const store = new SqliteIdempotencyStore(database);

      store.begin({
        scope: 'backup-request',
        idempotencyKey: 'backup-001',
        requestHash: requestHashA,
      });

      const completed = store.complete(
        'backup-request',
        undefined,
        'backup-001',
        'backup:abc',
        () => new Date('2026-08-19T01:02:00.000Z'),
      );

      expect(completed.status).toBe('COMPLETED');

      expect(completed.resultReference).toBe('backup:abc');

      expect(() =>
        store.fail('backup-request', undefined, 'backup-001', 'too late'),
      ).toThrow(IdempotencyStateError);
    } finally {
      database.close();
    }
  });
});
