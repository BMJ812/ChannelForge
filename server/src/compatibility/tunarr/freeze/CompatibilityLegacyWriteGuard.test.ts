import { describe, expect, it } from 'vitest';

import type {
  CompatibilityCounterMetric,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
  CompatibilityTimingMetric,
} from '../ports/CompatibilityMetrics.js';
import { CompatibilityLegacyJobHandler } from '../jobs/CompatibilityLegacyJobHandler.js';
import { CompatibilityLegacyWriteGuard } from './CompatibilityLegacyWriteGuard.js';
import {
  LegacyWriteFreezeRegistry,
  LegacyWritePathIds,
  TunarrLegacyWriteFreezeEntries,
  type LegacyWriteFreezeEntry,
} from './LegacyWriteFreezeRegistry.js';

class RecordingMetrics implements CompatibilityMetrics {
  readonly counters: {
    metric: CompatibilityCounterMetric;
    dimensions: CompatibilityMetricDimensions;
  }[] = [];

  increment(
    metric: CompatibilityCounterMetric,
    dimensions: CompatibilityMetricDimensions,
  ): void {
    this.counters.push({ metric, dimensions });
  }

  setGauge(
    _metric: CompatibilityGaugeMetric,
    _value: number,
    _dimensions: CompatibilityMetricDimensions,
  ): void {}

  observeMilliseconds(
    _metric: CompatibilityTimingMetric,
    _milliseconds: number,
    _dimensions: CompatibilityMetricDimensions,
  ): void {}
}

function withFrozenJobPath(): readonly LegacyWriteFreezeEntry[] {
  return TunarrLegacyWriteFreezeEntries.map((entry) =>
    entry.writePath === 'legacy-jobs'
      ? Object.freeze({ ...entry, state: 'FROZEN' as const })
      : entry,
  );
}

describe('M04 freeze registry', () => {
  it('defines the planned server-side write paths exactly and leaves them active by default', () => {
    expect(LegacyWritePathIds).toEqual([
      'legacy-management-routes',
      'legacy-jobs',
      'legacy-direct-database-writers',
      'legacy-schedule-writers',
      'legacy-provider-sync-writers',
      'legacy-output-generators',
      'legacy-settings-writers',
      'legacy-cleanup-jobs',
    ]);

    expect(TunarrLegacyWriteFreezeEntries).toHaveLength(8);
    expect(
      TunarrLegacyWriteFreezeEntries.every((entry) => entry.state === 'ACTIVE'),
    ).toBe(true);
  });

  it('keeps registry entries immutable and unique', () => {
    const registry = new LegacyWriteFreezeRegistry();
    const ids = registry.getAll().map((entry) => entry.writePath);

    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of registry.getAll()) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });

  it('allows active write paths without recording a frozen attempt', () => {
    const metrics = new RecordingMetrics();
    const guard = new CompatibilityLegacyWriteGuard({ metrics });

    const decision = guard.evaluate({ writePath: 'legacy-jobs' });

    expect(decision).toMatchObject({ allowed: true });
    expect(metrics.counters).toHaveLength(0);
  });

  it('blocks a frozen write path with stable error and bounded metrics', () => {
    const metrics = new RecordingMetrics();
    const guard = new CompatibilityLegacyWriteGuard({
      registry: new LegacyWriteFreezeRegistry(withFrozenJobPath()),
      metrics,
    });

    const decision = guard.evaluate({ writePath: 'legacy-jobs' });

    expect(decision).toMatchObject({
      allowed: false,
      error: {
        code: 'LEGACY_WRITE_FROZEN',
        retryable: false,
      },
    });

    expect(metrics.counters).toEqual([
      {
        metric: 'FROZEN_WRITE_ATTEMPTS',
        dimensions: {
          concept: 'background-jobs',
          entityType: 'legacy-write-path',
          operation: 'legacy-jobs',
          mode: 'FROZEN_LEGACY_WRITE',
          result: 'FROZEN',
        },
      },
    ]);
  });

  it('blocks a LEGACY_WRITE job before translation or execution', async () => {
    let translated = false;
    let executed = false;

    const freezeGuard = new CompatibilityLegacyWriteGuard({
      registry: new LegacyWriteFreezeRegistry(withFrozenJobPath()),
    });
    const handler = new CompatibilityLegacyJobHandler({ freezeGuard });

    const result = await handler.execute({
      jobId: 'ReconcileProgramDurationsTask',
      input: { raw: 'must-not-run' },
      translateInput(input) {
        translated = true;
        return input;
      },
      execute() {
        executed = true;
      },
    });

    expect(translated).toBe(false);
    expect(executed).toBe(false);
    expect(result).toMatchObject({
      outcome: 'SKIPPED',
      error: { code: 'LEGACY_WRITE_FROZEN', retryable: false },
    });
  });

  it('does not block a non-writing job through the legacy-jobs freeze', async () => {
    const freezeGuard = new CompatibilityLegacyWriteGuard({
      registry: new LegacyWriteFreezeRegistry(withFrozenJobPath()),
    });
    const handler = new CompatibilityLegacyJobHandler({ freezeGuard });

    const result = await handler.execute({
      jobId: 'ScheduleJobsStartupTask',
      input: undefined,
      execute() {
        return 'allowed';
      },
    });

    expect(result).toMatchObject({ outcome: 'SUCCESS', value: 'allowed' });
  });

  it('supports rollback by restoring the registry entry to ACTIVE', async () => {
    let calls = 0;

    const frozenHandler = new CompatibilityLegacyJobHandler({
      freezeGuard: new CompatibilityLegacyWriteGuard({
        registry: new LegacyWriteFreezeRegistry(withFrozenJobPath()),
      }),
    });

    await frozenHandler.execute({
      jobId: 'ReconcileProgramDurationsTask',
      input: undefined,
      execute() {
        calls += 1;
      },
    });

    const activeHandler = new CompatibilityLegacyJobHandler({
      freezeGuard: new CompatibilityLegacyWriteGuard({
        registry: new LegacyWriteFreezeRegistry(),
      }),
    });

    const result = await activeHandler.execute({
      jobId: 'ReconcileProgramDurationsTask',
      input: undefined,
      execute() {
        calls += 1;
      },
    });

    expect(calls).toBe(1);
    expect(result.outcome).toBe('SUCCESS');
  });
});
