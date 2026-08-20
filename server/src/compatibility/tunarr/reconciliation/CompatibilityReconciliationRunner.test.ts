import { describe, expect, it, vi } from 'vitest';

import {
  CompatibilityReconciliationFindingId,
  CompatibilityReconciliationJobId,
  type CompatibilityReconciliationFinding,
  type CompatibilityReconciliationFindingDraft,
  type CompatibilityReconciliationJob,
  type CompatibilityReconciliationRepository,
} from '../ports/index.js';
import { RuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';

import { CompatibilityReconciliationDiagnostics } from './CompatibilityReconciliationDiagnostics.js';
import { CompatibilityReconciliationRunner } from './CompatibilityReconciliationRunner.js';

function job(
  overrides: Partial<CompatibilityReconciliationJob> = {},
): CompatibilityReconciliationJob {
  return Object.freeze({
    jobId: CompatibilityReconciliationJobId.generate(),
    conceptType: 'channel',
    subjectKey: 'proof-channel',
    reason: 'LEGACY_PROJECTION_FAILED',
    canonicalVersion: '11',
    legacyVersion: '10',
    errorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
    routeTemplate: '/api/channels/:id',
    operation: 'channel.update',
    state: 'RUNNING',
    attemptCount: 1,
    processedCount: 0,
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-20T08:01:00.000Z',
    startedAt: '2026-08-20T08:01:00.000Z',
    ...overrides,
  });
}

function finding(
  activeJob: CompatibilityReconciliationJob,
  draft: CompatibilityReconciliationFindingDraft,
  at: string,
): CompatibilityReconciliationFinding {
  return Object.freeze({
    findingId: CompatibilityReconciliationFindingId.generate(),
    jobId: activeJob.jobId,
    findingKey: draft.findingKey,
    conceptType: activeJob.conceptType,
    subjectKey: activeJob.subjectKey,
    ...(draft.channelForgeId === undefined
      ? {}
      : { channelForgeId: draft.channelForgeId }),
    ...(draft.legacyNamespace === undefined
      ? {}
      : {
          legacyNamespace: draft.legacyNamespace,
          legacyId: draft.legacyId!,
        }),
    differenceCode: draft.differenceCode,
    severity: draft.severity,
    outcome: draft.outcome,
    ...(draft.repairAction === undefined
      ? {}
      : { repairAction: draft.repairAction }),
    attemptCount: 1,
    status: draft.status,
    firstObservedAt: at,
    lastObservedAt: at,
    ...(draft.status === 'RESOLVED' ? { resolvedAt: at } : {}),
  });
}

function repository(
  activeJob: CompatibilityReconciliationJob | undefined,
): CompatibilityReconciliationRepository {
  return {
    enqueue: vi.fn(async () => ({
      jobId: activeJob?.jobId ?? CompatibilityReconciliationJobId.generate(),
      queueDepth: activeJob === undefined ? 0 : 1,
    })),

    recoverInterrupted: vi.fn(() => 0),

    claimNext: vi.fn(() => activeJob),

    checkpoint: vi.fn(),

    complete: vi.fn(),

    retry: vi.fn(),

    fail: vi.fn(),

    cancel: vi.fn(),

    upsertFinding: vi.fn((jobId, draft, at) => {
      if (activeJob === undefined || jobId !== activeJob.jobId) {
        throw new Error('unknown test job');
      }

      return finding(activeJob, draft, at);
    }),

    getJob: vi.fn(() => activeJob),

    listJobs: vi.fn(() =>
      activeJob === undefined ? Object.freeze([]) : Object.freeze([activeJob]),
    ),

    listOpenFindings: vi.fn(() => Object.freeze([])),

    countQueued: vi.fn(() => (activeJob === undefined ? 0 : 1)),

    oldestOpenFindingAt: vi.fn(() => undefined),
  };
}

describe('CompatibilityReconciliationRunner', () => {
  it('processes exactly one bounded batch and persists a restart checkpoint', async () => {
    const activeJob = job();
    const store = repository(activeJob);
    const metrics = new RuntimeCompatibilityMetrics();

    vi.mocked(store.oldestOpenFindingAt).mockReturnValue(
      '2026-08-20T08:09:00.000Z',
    );

    const worker = {
      reconcileBatch: vi.fn(async () => ({
        compared: 2,
        complete: false,
        checkpoint: 'cursor:2',
        outcomeCounts: {
          EQUAL: 1,
          CONFLICT: 1,
        },
        findings: [
          {
            findingKey: 'channel-name',
            channelForgeId: 'cf-channel',
            legacyNamespace: 'tunarr',
            legacyId: 'legacy-channel',
            differenceCode: 'CHANNEL_NAME_MISMATCH',
            severity: 'ERROR' as const,
            outcome: 'CONFLICT' as const,
            repairAction: 'Operator review',
            status: 'OPEN' as const,
          },
        ],
      })),
    };

    const monotonic = [10, 35];

    const runner = new CompatibilityReconciliationRunner({
      repository: store,
      worker,
      metrics,
      batchSize: 2,
      now: () => '2026-08-20T08:10:00.000Z',
      monotonicNow: () => monotonic.shift() ?? 35,
    });

    const result = await runner.runNext();

    expect(result).toMatchObject({
      state: 'PROCESSED',
      jobId: activeJob.jobId,
      disposition: 'CHECKPOINTED',
      compared: 2,
      findingCount: 1,
    });

    expect(worker.reconcileBatch).toHaveBeenCalledWith({
      job: activeJob,
      batchSize: 2,
    });

    expect(store.upsertFinding).toHaveBeenCalledTimes(1);

    expect(store.checkpoint).toHaveBeenCalledWith(
      activeJob.jobId,
      'cursor:2',
      2,
      '2026-08-20T08:10:00.000Z',
    );

    expect(store.complete).not.toHaveBeenCalled();

    const snapshot = metrics.snapshot();

    expect(
      snapshot.counters.find(
        (entry) => entry.metric === 'RECONCILIATION_ITEMS_COMPARED',
      )?.value,
    ).toBe(2);

    expect(
      snapshot.counters.find((entry) => entry.metric === 'RECONCILIATION_EQUAL')
        ?.value,
    ).toBe(1);

    expect(
      snapshot.counters.find(
        (entry) => entry.metric === 'RECONCILIATION_CONFLICTS',
      )?.value,
    ).toBe(1);

    expect(
      snapshot.timings.find(
        (entry) => entry.metric === 'RECONCILIATION_DURATION',
      ),
    ).toMatchObject({
      count: 1,
      totalMilliseconds: 25,
      maxMilliseconds: 25,
    });

    for (const entry of snapshot.counters) {
      expect(Object.keys(entry.dimensions)).not.toContain('subjectKey');
      expect(Object.keys(entry.dimensions)).not.toContain('channelForgeId');
      expect(Object.keys(entry.dimensions)).not.toContain('legacyId');
    }

    expect(
      snapshot.gauges.find(
        (entry) => entry.metric === 'OLDEST_RECONCILIATION_FINDING_AGE_SECONDS',
      )?.value,
    ).toBe(60);
  });

  it('marks a completed bounded batch terminally complete', async () => {
    const activeJob = job();
    const store = repository(activeJob);

    const runner = new CompatibilityReconciliationRunner({
      repository: store,
      worker: {
        reconcileBatch: async () => ({
          compared: 1,
          complete: true,
          outcomeCounts: {
            LEGACY_REPAIRED: 1,
          },
          findings: [],
        }),
      },
      metrics: new RuntimeCompatibilityMetrics(),
      batchSize: 10,
      now: () => '2026-08-20T08:20:00.000Z',
      monotonicNow: () => 1,
    });

    await expect(runner.runNext()).resolves.toMatchObject({
      disposition: 'COMPLETED',
      compared: 1,
    });

    expect(store.complete).toHaveBeenCalledWith(
      activeJob.jobId,
      1,
      '2026-08-20T08:20:00.000Z',
    );

    expect(store.checkpoint).not.toHaveBeenCalled();
  });

  it('requeues a retryable worker failure below the attempt ceiling', async () => {
    const activeJob = job({
      attemptCount: 1,
      checkpoint: 'cursor:7',
    });

    const store = repository(activeJob);
    const metrics = new RuntimeCompatibilityMetrics();

    const runner = new CompatibilityReconciliationRunner({
      repository: store,
      worker: {
        reconcileBatch: async () => {
          throw new Error('temporary projection outage');
        },
      },
      metrics,
      maxAttempts: 2,
      now: () => '2026-08-20T08:30:00.000Z',
      monotonicNow: () => 1,
    });

    await expect(runner.runNext()).resolves.toMatchObject({
      disposition: 'RETRY_QUEUED',
      compared: 0,
    });

    expect(store.retry).toHaveBeenCalledWith(
      activeJob.jobId,
      'cursor:7',
      0,
      'COMPATIBILITY_UNAVAILABLE',
      '2026-08-20T08:30:00.000Z',
    );

    expect(store.fail).not.toHaveBeenCalled();

    expect(
      metrics
        .snapshot()
        .counters.find((entry) => entry.metric === 'RECONCILIATION_RETRIES')
        ?.value,
    ).toBe(1);
  });

  it('fails a retryable worker failure at the attempt ceiling', async () => {
    const activeJob = job({
      attemptCount: 2,
    });

    const store = repository(activeJob);
    const metrics = new RuntimeCompatibilityMetrics();

    const runner = new CompatibilityReconciliationRunner({
      repository: store,
      worker: {
        reconcileBatch: async () => {
          throw new Error('persistent projection outage');
        },
      },
      metrics,
      maxAttempts: 2,
      now: () => '2026-08-20T08:40:00.000Z',
      monotonicNow: () => 1,
    });

    await expect(runner.runNext()).resolves.toMatchObject({
      disposition: 'FAILED',
    });

    expect(store.fail).toHaveBeenCalledWith(
      activeJob.jobId,
      'COMPATIBILITY_UNAVAILABLE',
      '2026-08-20T08:40:00.000Z',
    );

    expect(store.retry).not.toHaveBeenCalled();

    expect(
      metrics
        .snapshot()
        .counters.find((entry) => entry.metric === 'RECONCILIATION_FAILED')
        ?.value,
    ).toBe(1);
  });

  it('fails an invalid worker batch without retrying it', async () => {
    const activeJob = job();
    const store = repository(activeJob);

    const runner = new CompatibilityReconciliationRunner({
      repository: store,
      worker: {
        reconcileBatch: async () => ({
          compared: 3,
          complete: true,
          outcomeCounts: {
            EQUAL: 2,
          },
          findings: [],
        }),
      },
      metrics: new RuntimeCompatibilityMetrics(),
      batchSize: 2,
      maxAttempts: 5,
      now: () => '2026-08-20T08:50:00.000Z',
      monotonicNow: () => 1,
    });

    await expect(runner.runNext()).resolves.toMatchObject({
      disposition: 'FAILED',
    });

    expect(store.fail).toHaveBeenCalledWith(
      activeJob.jobId,
      'COMPATIBILITY_TRANSLATION_FAILED',
      '2026-08-20T08:50:00.000Z',
    );

    expect(store.retry).not.toHaveBeenCalled();
  });

  it('honors cancellation observed at the bounded batch boundary', async () => {
    const activeJob = job();
    const store = repository(activeJob);

    vi.mocked(store.getJob).mockReturnValue(
      Object.freeze({
        ...activeJob,
        state: 'CANCELED',
        completedAt: '2026-08-20T09:00:00.000Z',
      }),
    );

    const runner = new CompatibilityReconciliationRunner({
      repository: store,
      worker: {
        reconcileBatch: async () => ({
          compared: 1,
          complete: true,
          outcomeCounts: {
            EQUAL: 1,
          },
          findings: [],
        }),
      },
      metrics: new RuntimeCompatibilityMetrics(),
      now: () => '2026-08-20T09:00:00.000Z',
      monotonicNow: () => 1,
    });

    await expect(runner.runNext()).resolves.toMatchObject({
      disposition: 'CANCELED',
      compared: 0,
      findingCount: 0,
    });

    expect(store.upsertFinding).not.toHaveBeenCalled();
    expect(store.complete).not.toHaveBeenCalled();
    expect(store.checkpoint).not.toHaveBeenCalled();
  });

  it('recovers interrupted jobs explicitly and returns idle when no job exists', async () => {
    const store = repository(undefined);

    vi.mocked(store.recoverInterrupted).mockReturnValue(2);

    const runner = new CompatibilityReconciliationRunner({
      repository: store,
      worker: {
        reconcileBatch: vi.fn(),
      },
      metrics: new RuntimeCompatibilityMetrics(),
      now: () => '2026-08-20T09:10:00.000Z',
    });

    expect(runner.recoverInterrupted()).toBe(2);

    expect(store.recoverInterrupted).toHaveBeenCalledWith(
      '2026-08-20T09:10:00.000Z',
    );

    await expect(runner.runNext()).resolves.toEqual({
      state: 'IDLE',
    });
  });

  it('rejects unbounded configuration', () => {
    const store = repository(undefined);
    const worker = {
      reconcileBatch: vi.fn(),
    };
    const metrics = new RuntimeCompatibilityMetrics();

    expect(
      () =>
        new CompatibilityReconciliationRunner({
          repository: store,
          worker,
          metrics,
          batchSize: 501,
        }),
    ).toThrow(RangeError);

    expect(
      () =>
        new CompatibilityReconciliationRunner({
          repository: store,
          worker,
          metrics,
          maxAttempts: 21,
        }),
    ).toThrow(RangeError);
  });
});

describe('CompatibilityReconciliationDiagnostics', () => {
  it('returns bounded read-only operator visibility', () => {
    const activeJob = job({
      state: 'QUEUED',
      startedAt: undefined,
    });

    const store = repository(activeJob);

    const openFinding = finding(
      activeJob,
      {
        findingKey: 'legacy-channel-number',
        differenceCode: 'CHANNEL_NUMBER_MISMATCH',
        severity: 'CRITICAL',
        outcome: 'OPERATOR_ACTION',
        repairAction: 'Resolve number ownership before cutover',
        status: 'OPEN',
      },
      '2026-08-20T09:18:00.000Z',
    );

    vi.mocked(store.countQueued).mockReturnValue(3);

    vi.mocked(store.oldestOpenFindingAt).mockReturnValue(
      '2026-08-20T09:18:00.000Z',
    );

    vi.mocked(store.listOpenFindings).mockReturnValue(
      Object.freeze([openFinding]),
    );

    const diagnostics = new CompatibilityReconciliationDiagnostics(
      store,
      () => '2026-08-20T09:20:00.000Z',
    );

    const snapshot = diagnostics.snapshot({
      jobLimit: 25,
      findingLimit: 40,
    });

    expect(snapshot).toMatchObject({
      queueDepth: 3,
      oldestOpenFindingAt: '2026-08-20T09:18:00.000Z',
      oldestOpenFindingAgeSeconds: 120,
    });

    expect(snapshot.recentJobs).toEqual([activeJob]);
    expect(snapshot.openFindings).toEqual([openFinding]);

    expect(store.listJobs).toHaveBeenCalledWith({
      limit: 25,
    });

    expect(store.listOpenFindings).toHaveBeenCalledWith(40);

    expect(() =>
      diagnostics.snapshot({
        jobLimit: 1001,
      }),
    ).toThrow(RangeError);
  });
});
