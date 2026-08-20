import { describe, expect, it } from 'vitest';

import {
  type CompatibilityReconciliationEnqueuePort,
  type CompatibilityStatusRecord,
  type CompatibilityStatusRepository,
} from '../ports/index.js';
import { RuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';
import { CompatibilityWriteCoordinator } from './CompatibilityWriteCoordinator.js';

class MemoryStatusRepository implements CompatibilityStatusRepository {
  record?: CompatibilityStatusRecord;
  writes = 0;
  failOnWrite?: number;

  findByScope(): CompatibilityStatusRecord | undefined {
    return this.record;
  }

  insert(record: CompatibilityStatusRecord): void {
    this.write(record);
  }

  update(record: CompatibilityStatusRecord, expectedVersion: number): void {
    if (this.record?.version !== expectedVersion) {
      throw new Error('concurrency');
    }
    this.write(record);
  }

  private write(record: CompatibilityStatusRecord): void {
    this.writes += 1;
    if (this.failOnWrite === this.writes) {
      throw new Error('status persistence failed');
    }
    this.record = record;
  }
}

function makeRequest(
  overrides: Partial<
    Parameters<CompatibilityWriteCoordinator['execute']>[0]
  > = {},
) {
  return {
    conceptType: 'channel',
    subjectKey: 'proof-channel',
    entityType: 'channel',
    channelForgeId: 'cf-channel-id',
    legacyNamespace: 'tunarr',
    legacyId: 'legacy-channel-id',
    routeTemplate: '/api/channels/:id',
    operation: 'channel-update',
    applicationVersion: '04h-test',
    sourceSchemaVersion: '7',
    commitAuthoritative: async () => ({ canonicalVersion: '11' }),
    projectLegacy: async () => ({ legacyVersion: '29' }),
    ...overrides,
  };
}

function makeCoordinator(
  statuses: MemoryStatusRepository,
  reconciliation: CompatibilityReconciliationEnqueuePort,
) {
  const metrics = new RuntimeCompatibilityMetrics();
  let isoTick = 0;
  let mono = 100;

  return {
    metrics,
    coordinator: new CompatibilityWriteCoordinator({
      statuses,
      reconciliation,
      metrics,
      now: () => {
        isoTick += 1;
        return new Date(Date.UTC(2026, 7, 20, 7, 0, isoTick)).toISOString();
      },
      monotonicNow: () => {
        mono += 5;
        return mono;
      },
    }),
  };
}

describe('CompatibilityWriteCoordinator', () => {
  it('persists PENDING then CURRENT on successful translation', async () => {
    const statuses = new MemoryStatusRepository();
    const runtime = makeCoordinator(statuses, {
      enqueue: async () => {
        throw new Error('unexpected reconciliation');
      },
    });

    const result = await runtime.coordinator.execute(makeRequest());

    expect(result).toEqual({
      status: { state: 'CURRENT' },
      statusPersisted: true,
      authoritativeCommitted: true,
      compatibilityProjected: true,
      reconciliationEnqueued: false,
    });

    expect(statuses.record).toMatchObject({
      status: { state: 'CURRENT' },
      canonicalVersion: '11',
      legacyVersion: '29',
      failureCount: 0,
      version: 2,
    });

    const snapshot = runtime.metrics.snapshot();
    expect(
      snapshot.counters.some(
        (entry) => entry.metric === 'LEGACY_WRITE_ATTEMPTS',
      ),
    ).toBe(true);
    expect(
      snapshot.counters.some(
        (entry) => entry.metric === 'TEMPORARY_TRANSLATION_SUCCESSES',
      ),
    ).toBe(true);
  });

  it('does not project legacy state when authoritative commit fails', async () => {
    const statuses = new MemoryStatusRepository();
    let projections = 0;

    const runtime = makeCoordinator(statuses, {
      enqueue: async () => ({ jobId: 'unexpected' }),
    });

    const result = await runtime.coordinator.execute(
      makeRequest({
        commitAuthoritative: async () => {
          throw new Error('canonical failure');
        },
        projectLegacy: async () => {
          projections += 1;
          return { legacyVersion: 'nope' };
        },
      }),
    );

    expect(result).toMatchObject({
      status: {
        state: 'FAILED',
        errorCode: 'COMPATIBILITY_UNAVAILABLE',
        retryable: false,
      },
      statusPersisted: true,
      authoritativeCommitted: false,
      compatibilityProjected: false,
    });
    expect(projections).toBe(0);
  });

  it('persists DEGRADED and enqueues reconciliation after projection failure', async () => {
    const statuses = new MemoryStatusRepository();

    const runtime = makeCoordinator(statuses, {
      enqueue: async () => ({
        jobId: 'reconcile-1',
        queueDepth: 4,
      }),
    });

    const result = await runtime.coordinator.execute(
      makeRequest({
        projectLegacy: async () => {
          throw new Error('projection failed');
        },
      }),
    );

    expect(result).toMatchObject({
      status: {
        state: 'DEGRADED',
        reconciliationRequired: true,
        errorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
      },
      statusPersisted: true,
      authoritativeCommitted: true,
      compatibilityProjected: false,
      reconciliationEnqueued: true,
      reconciliationJobId: 'reconcile-1',
    });

    expect(statuses.record).toMatchObject({
      status: { state: 'DEGRADED' },
      canonicalVersion: '11',
      failureCount: 1,
    });

    const serialized = JSON.stringify(runtime.metrics.snapshot());
    expect(serialized).not.toContain('cf-channel-id');
    expect(serialized).not.toContain('legacy-channel-id');
    expect(serialized).not.toContain('proof-channel');
  });

  it('keeps durable DEGRADED state when reconciliation enqueue fails', async () => {
    const statuses = new MemoryStatusRepository();

    const runtime = makeCoordinator(statuses, {
      enqueue: async () => {
        throw new Error('queue unavailable');
      },
    });

    const result = await runtime.coordinator.execute(
      makeRequest({
        projectLegacy: async () => {
          throw new Error('projection failed');
        },
      }),
    );

    expect(result).toMatchObject({
      status: { state: 'DEGRADED' },
      statusPersisted: true,
      reconciliationEnqueued: false,
    });
  });

  it('blocks the authoritative command when PENDING cannot be persisted', async () => {
    const statuses = new MemoryStatusRepository();
    statuses.failOnWrite = 1;
    let authoritativeAttempts = 0;

    const runtime = makeCoordinator(statuses, {
      enqueue: async () => ({ jobId: 'unexpected' }),
    });

    const result = await runtime.coordinator.execute(
      makeRequest({
        commitAuthoritative: async () => {
          authoritativeAttempts += 1;
          return { canonicalVersion: '11' };
        },
      }),
    );

    expect(result).toMatchObject({
      status: { state: 'FAILED' },
      statusPersisted: false,
      authoritativeCommitted: false,
    });
    expect(authoritativeAttempts).toBe(0);
  });

  it('queues status recovery when projection succeeds but CURRENT persistence fails', async () => {
    const statuses = new MemoryStatusRepository();
    statuses.failOnWrite = 2;
    const reasons: string[] = [];

    const runtime = makeCoordinator(statuses, {
      enqueue: async (request) => {
        reasons.push(request.reason);
        return { jobId: 'status-recovery-1' };
      },
    });

    const result = await runtime.coordinator.execute(makeRequest());

    expect(result).toMatchObject({
      status: {
        state: 'DEGRADED',
        reconciliationRequired: true,
        errorCode: 'COMPATIBILITY_UNAVAILABLE',
      },
      statusPersisted: false,
      authoritativeCommitted: true,
      compatibilityProjected: true,
      reconciliationEnqueued: true,
    });

    expect(reasons).toEqual(['STATUS_PERSISTENCE_FAILED']);
  });
});
