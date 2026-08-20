import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { CompatibilityReconciliationRequest } from '@/compatibility/tunarr/ports/index.js';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import { SqliteCompatibilityReconciliationRepository } from './SqliteCompatibilityReconciliationRepository.js';

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-reconcile-'));
  directories.push(directory);

  return join(directory, 'database.sqlite');
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function request(): CompatibilityReconciliationRequest {
  return Object.freeze({
    conceptType: 'channel',
    subjectKey: 'proof-channel',
    reason: 'LEGACY_PROJECTION_FAILED',
    canonicalVersion: '11',
    legacyVersion: '10',
    errorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
    routeTemplate: '/api/channels/:id',
    operation: 'channel.update',
    correlationId: 'correlation-1',
  });
}

describe('SqliteCompatibilityReconciliationRepository', () => {
  it('persists queue progress and findings across restart', async () => {
    const filename = createFilename();
    const timestamps = ['2026-08-20T08:10:00.000Z', '2026-08-20T08:11:00.000Z'];

    const first = openChannelForgeSqliteConnection(filename);

    let jobId: string;
    let findingId: string;

    try {
      new ChannelForgeMigrationRunner(
        first,
        channelForgeSchemaMigrations,
      ).migrate();

      const repository = new SqliteCompatibilityReconciliationRepository(
        first,
        () => timestamps.shift() ?? '2026-08-20T08:12:00.000Z',
      );

      const enqueued = await repository.enqueue(request());
      jobId = enqueued.jobId;

      expect(enqueued.queueDepth).toBe(1);

      const duplicate = await repository.enqueue(request());

      expect(duplicate.jobId).toBe(jobId);
      expect(repository.countQueued()).toBe(1);

      const claimed = repository.claimNext('2026-08-20T08:13:00.000Z');

      expect(claimed).toMatchObject({
        jobId,
        state: 'RUNNING',
        attemptCount: 1,
        processedCount: 0,
      });

      expect(repository.recoverInterrupted('2026-08-20T08:14:00.000Z')).toBe(1);

      expect(repository.getJob(claimed!.jobId)).toMatchObject({
        state: 'QUEUED',
        attemptCount: 1,
      });

      const reclaimed = repository.claimNext('2026-08-20T08:15:00.000Z');

      expect(reclaimed).toMatchObject({
        state: 'RUNNING',
        attemptCount: 2,
      });

      repository.checkpoint(
        reclaimed!.jobId,
        'cursor:2',
        2,
        '2026-08-20T08:16:00.000Z',
      );

      expect(repository.getJob(reclaimed!.jobId)).toMatchObject({
        state: 'QUEUED',
        checkpoint: 'cursor:2',
        attemptCount: 2,
        processedCount: 2,
      });

      const thirdClaim = repository.claimNext('2026-08-20T08:17:00.000Z');

      expect(thirdClaim).toMatchObject({
        state: 'RUNNING',
        checkpoint: 'cursor:2',
        attemptCount: 3,
        processedCount: 2,
      });

      const finding = repository.upsertFinding(
        thirdClaim!.jobId,
        {
          findingKey: 'legacy-name-mismatch',
          channelForgeId: 'cf-channel',
          legacyNamespace: 'tunarr',
          legacyId: 'legacy-channel',
          differenceCode: 'CHANNEL_NAME_MISMATCH',
          severity: 'WARNING',
          outcome: 'OPERATOR_ACTION',
          repairAction: 'Review compatibility representation',
          status: 'OPEN',
        },
        '2026-08-20T08:18:00.000Z',
      );

      findingId = finding.findingId;

      const repeatedFinding = repository.upsertFinding(
        thirdClaim!.jobId,
        {
          findingKey: 'legacy-name-mismatch',
          channelForgeId: 'cf-channel',
          legacyNamespace: 'tunarr',
          legacyId: 'legacy-channel',
          differenceCode: 'CHANNEL_NAME_MISMATCH',
          severity: 'ERROR',
          outcome: 'OPERATOR_ACTION',
          repairAction: 'Review compatibility representation',
          status: 'OPEN',
        },
        '2026-08-20T08:19:00.000Z',
      );

      expect(repeatedFinding).toMatchObject({
        findingId,
        attemptCount: 2,
        severity: 'ERROR',
        status: 'OPEN',
      });

      expect(repository.listOpenFindings()).toHaveLength(1);
      expect(repository.oldestOpenFindingAt()).toBe('2026-08-20T08:18:00.000Z');

      repository.complete(thirdClaim!.jobId, 1, '2026-08-20T08:20:00.000Z');

      expect(repository.getJob(thirdClaim!.jobId)).toMatchObject({
        state: 'COMPLETED',
        attemptCount: 3,
        processedCount: 3,
        completedAt: '2026-08-20T08:20:00.000Z',
      });

      expect(repository.countQueued()).toBe(0);
      expect(first.pragma('foreign_key_check')).toEqual([]);
    } finally {
      first.close();
    }

    const reopened = openChannelForgeSqliteConnection(filename);

    try {
      const repository = new SqliteCompatibilityReconciliationRepository(
        reopened,
      );

      const jobs = repository.listJobs();

      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        jobId,
        state: 'COMPLETED',
        checkpoint: 'cursor:2',
        processedCount: 3,
      });

      const findings = repository.listOpenFindings();

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({
        findingId,
        jobId,
        findingKey: 'legacy-name-mismatch',
        attemptCount: 2,
        severity: 'ERROR',
        status: 'OPEN',
      });

      expect(reopened.pragma('foreign_key_check')).toEqual([]);
    } finally {
      reopened.close();
    }
  });

  it('supports safe terminal failure and cancellation states', async () => {
    const filename = createFilename();
    const database = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const repository = new SqliteCompatibilityReconciliationRepository(
        database,
        () => '2026-08-20T08:30:00.000Z',
      );

      const first = await repository.enqueue(request());
      const claimed = repository.claimNext('2026-08-20T08:31:00.000Z');

      expect(claimed?.jobId).toBe(first.jobId);

      repository.fail(
        claimed!.jobId,
        'COMPATIBILITY_UNAVAILABLE',
        '2026-08-20T08:32:00.000Z',
      );

      expect(repository.getJob(claimed!.jobId)).toMatchObject({
        state: 'FAILED',
        lastErrorCode: 'COMPATIBILITY_UNAVAILABLE',
        completedAt: '2026-08-20T08:32:00.000Z',
      });

      const second = await repository.enqueue(request());

      repository.cancel(
        second.jobId as typeof claimed.jobId,
        '2026-08-20T08:33:00.000Z',
      );

      expect(
        repository.getJob(second.jobId as typeof claimed.jobId),
      ).toMatchObject({
        state: 'CANCELED',
        completedAt: '2026-08-20T08:33:00.000Z',
      });
    } finally {
      database.close();
    }
  });

  it('registers migration 0008 last', () => {
    expect(channelForgeSchemaMigrations.at(-1)?.id).toBe(
      '0008_compatibility_reconciliation',
    );
  });
});
