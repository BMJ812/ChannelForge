import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  CompatibilityStatusConcurrencyError,
  CompatibilityStatusId,
  type CompatibilityStatusRecord,
} from '@/compatibility/tunarr/ports/index.js';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import { SqliteCompatibilityStatusRepository } from './SqliteCompatibilityStatusRepository.js';

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-compat-status-'));
  directories.push(directory);
  return join(directory, 'database.sqlite');
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function pendingRecord(): CompatibilityStatusRecord {
  const at = '2026-08-20T07:00:00.000Z';

  return Object.freeze({
    statusId: CompatibilityStatusId.generate(),
    conceptType: 'channel',
    subjectKey: 'proof-channel',
    channelForgeId: 'cf-channel',
    legacyNamespace: 'tunarr',
    legacyId: 'legacy-channel',
    mode: 'TEMPORARY_WRITE_TRANSLATION',
    status: { state: 'PENDING' },
    lastAttemptAt: at,
    failureCount: 0,
    createdAt: at,
    updatedAt: at,
    version: 1,
  });
}

describe('SqliteCompatibilityStatusRepository', () => {
  it('persists across reopen and enforces optimistic concurrency', () => {
    const filename = createFilename();
    const initial = pendingRecord();

    const first = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        first,
        channelForgeSchemaMigrations,
      ).migrate();

      const repository = new SqliteCompatibilityStatusRepository(first);

      repository.insert(initial);

      const degraded: CompatibilityStatusRecord = Object.freeze({
        ...initial,
        status: {
          state: 'DEGRADED',
          reconciliationRequired: true,
          errorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
        },
        canonicalVersion: '11',
        failureCount: 1,
        lastErrorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
        reconciliationJobId: 'reconcile-1',
        updatedAt: '2026-08-20T07:01:00.000Z',
        version: 2,
      });

      repository.update(degraded, 1);

      expect(() =>
        repository.update(
          Object.freeze({
            ...degraded,
            updatedAt: '2026-08-20T07:02:00.000Z',
            version: 3,
          }),
          1,
        ),
      ).toThrow(CompatibilityStatusConcurrencyError);
    } finally {
      first.close();
    }

    const reopened = openChannelForgeSqliteConnection(filename);

    try {
      const repository = new SqliteCompatibilityStatusRepository(reopened);

      expect(
        repository.findByScope({
          conceptType: 'channel',
          subjectKey: 'proof-channel',
        }),
      ).toMatchObject({
        statusId: initial.statusId,
        status: {
          state: 'DEGRADED',
          reconciliationRequired: true,
          errorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
        },
        canonicalVersion: '11',
        failureCount: 1,
        reconciliationJobId: 'reconcile-1',
        version: 2,
      });

      expect(reopened.pragma('foreign_key_check')).toEqual([]);
    } finally {
      reopened.close();
    }
  });

  it('registers migration 0007 last', () => {
    expect(channelForgeSchemaMigrations.at(-1)?.id).toBe(
      '0007_compatibility_status',
    );
  });
});
