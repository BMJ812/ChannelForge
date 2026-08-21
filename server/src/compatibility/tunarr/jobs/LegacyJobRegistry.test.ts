import { describe, expect, it } from 'vitest';
import type {
  CompatibilityCounterMetric,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
  CompatibilityTimingMetric,
} from '../ports/CompatibilityMetrics.js';
import {
  CompatibilityLegacyJobHandler,
  type CompatibilityLegacyJobStatusRecord,
} from './CompatibilityLegacyJobHandler.js';
import {
  LegacyJobClassifications,
  LegacyJobRegistry,
  LegacyJobRegistryError,
  LegacyJobTriggerKinds,
  TunarrLegacyJobs,
} from './LegacyJobRegistry.js';

class Metrics implements CompatibilityMetrics {
  readonly counters: {
    metric: CompatibilityCounterMetric;
    dimensions: CompatibilityMetricDimensions;
  }[] = [];
  increment(
    metric: CompatibilityCounterMetric,
    dimensions: CompatibilityMetricDimensions,
  ) {
    this.counters.push({ metric, dimensions });
  }
  setGauge(
    _m: CompatibilityGaugeMetric,
    _v: number,
    _d: CompatibilityMetricDimensions,
  ) {}
  observeMilliseconds(
    _m: CompatibilityTimingMetric,
    _v: number,
    _d: CompatibilityMetricDimensions,
  ) {}
}

const Expected = [
  'BackupTask',
  'ChannelLineupMigratorStartupTask',
  'CleanupSessionsTask',
  'ClearM3uCacheStartupTask',
  'ClearM3uCacheTask',
  'FixerRunner',
  'GenerateGuideStartupTask',
  'OnDemandChannelStateTask',
  'ReconcileProgramDurationsTask',
  'RefreshLibrariesStartupTask',
  'RefreshMediaSourceLibraryTask',
  'RemoveDanglingProgramsFromSearchTask',
  'RollLogFileTask',
  'ScanLibrariesTask',
  'ScheduleJobsStartupTask',
  'SeedFfmpegInfoCache',
  'SeedSystemDevicesStartupTask',
  'SubtitleExtractorTask',
  'SyncCollectionsTask',
  'SyncCustomShowsTask',
  'UpdateJellyfinPlayStatusScheduledTask',
  'UpdateJellyfinPlayStatusTask',
  'UpdatePlexPlayStatusScheduledTask',
  'UpdatePlexPlayStatusTask',
  'UpdateXmlTvTask',
] as const;

describe('M04 legacy job registry', () => {
  it('defines roadmap classifications and triggers exactly', () => {
    expect(LegacyJobClassifications).toEqual([
      'READ_ONLY',
      'LEGACY_WRITE',
      'COMPATIBILITY_PROJECTION',
      'PROVIDER_SYNCHRONIZATION',
      'SCHEDULE_GENERATION',
      'ARTIFACT_GENERATION',
      'CLEANUP',
      'BACKUP',
      'UNKNOWN',
    ]);
    expect(LegacyJobTriggerKinds).toEqual(['STARTUP', 'SCHEDULED', 'DYNAMIC']);
  });

  it('inventories exactly 25 concrete inherited runtime jobs', () => {
    expect(TunarrLegacyJobs).toHaveLength(25);
    expect(TunarrLegacyJobs.map((j) => j.id).sort()).toEqual(
      [...Expected].sort(),
    );
  });

  it('keeps IDs/source symbols unique and immutable', () => {
    const ids = new Set<string>();
    const sources = new Set<string>();
    for (const job of TunarrLegacyJobs) {
      expect(ids.has(job.id)).toBe(false);
      ids.add(job.id);
      const source = `${job.sourcePath}#${job.sourceSymbol}`;
      expect(sources.has(source)).toBe(false);
      sources.add(source);
      expect(Object.isFrozen(job)).toBe(true);
      expect(Object.isFrozen(job.classifications)).toBe(true);
      expect(Object.isFrozen(job.triggers)).toBe(true);
    }
  });

  it('excludes execution framework helpers', () => {
    const ids = new Set(TunarrLegacyJobs.map((j) => j.id));
    for (const helper of [
      'Task2',
      'SimpleTask',
      'TaskRegistry',
      'ScheduledTask',
      'OneOffTask',
      'CompoundTask',
      'NoopTask',
      'TasksModule',
      'StartupService',
    ])
      expect(ids.has(helper)).toBe(false);
  });

  it('preserves mixed classifications', () => {
    const registry = new LegacyJobRegistry();
    expect(registry.require('UpdateXmlTvTask').classifications).toEqual([
      'ARTIFACT_GENERATION',
      'PROVIDER_SYNCHRONIZATION',
      'LEGACY_WRITE',
    ]);
    expect(
      registry.byClassification('LEGACY_WRITE').map((j) => j.id),
    ).toContain('ReconcileProgramDurationsTask');
    expect(registry.byTrigger('STARTUP').map((j) => j.id)).toContain(
      'FixerRunner',
    );
  });

  it('fails closed for unknown and duplicate identities', () => {
    const registry = new LegacyJobRegistry();
    expect(() => registry.require('missing')).toThrow(LegacyJobRegistryError);
    const first = TunarrLegacyJobs[0];
    if (first === undefined) throw new Error('inventory missing');
    expect(() => new LegacyJobRegistry([first, first])).toThrow(
      'DUPLICATE_JOB_ID',
    );
    expect(
      () => new LegacyJobRegistry([first, { ...first, id: 'other' }]),
    ).toThrow('DUPLICATE_SOURCE');
  });
});

describe('M04 legacy job compatibility handler', () => {
  it('translates input, executes compatibility action, records status and bounded usage', async () => {
    const metrics = new Metrics();
    const statuses: CompatibilityLegacyJobStatusRecord[] = [];
    const handler = new CompatibilityLegacyJobHandler({
      metrics,
      statusRecorder: {
        record: (status) => {
          statuses.push(status);
        },
      },
    });

    const result = await handler.execute({
      jobId: 'RefreshMediaSourceLibraryTask',
      input: { legacyId: 'do-not-put-in-metrics' },
      translateInput: (input) => ({ canonicalRef: input.legacyId }),
      execute: (input) => input.canonicalRef.length,
    });

    expect(result.outcome).toBe('SUCCESS');
    expect(statuses.map((s) => s.status)).toEqual(['STARTED', 'SUCCEEDED']);
    expect(metrics.counters).toHaveLength(1);
    expect(metrics.counters[0]).toMatchObject({
      metric: 'LEGACY_JOB_EXECUTIONS',
      dimensions: {
        concept: 'legacy-job',
        operation: 'RefreshMediaSourceLibraryTask',
        mode: 'LEGACY_ONLY',
        result: 'SUCCESS',
      },
    });
    expect(JSON.stringify(metrics.counters[0]?.dimensions)).not.toContain(
      'do-not-put-in-metrics',
    );
  });

  it('contains translation and action failures behind stable descriptors', async () => {
    const handler = new CompatibilityLegacyJobHandler();
    const translation = await handler.execute({
      jobId: 'UpdateXmlTvTask',
      input: 'secret-input',
      translateInput: () => {
        throw new Error('raw translator error');
      },
      execute: () => 'never',
    });
    expect(translation).toMatchObject({
      outcome: 'FAILED',
      error: { code: 'COMPATIBILITY_TRANSLATION_FAILED', retryable: false },
    });
    expect(JSON.stringify(translation)).not.toContain('secret-input');
    expect(JSON.stringify(translation)).not.toContain('raw translator error');

    const execution = await handler.execute({
      jobId: 'GenerateGuideStartupTask',
      input: undefined,
      execute: () => {
        throw new Error('raw execution error');
      },
    });
    expect(execution).toMatchObject({
      outcome: 'FAILED',
      error: { code: 'COMPATIBILITY_UNAVAILABLE', retryable: true },
    });
    expect(JSON.stringify(execution)).not.toContain('raw execution error');
  });

  it('honors external freeze policy without a handler bypass', async () => {
    let called = false;
    const handler = new CompatibilityLegacyJobHandler({
      executionPolicy: {
        evaluate: (job) =>
          job.classifications.includes('LEGACY_WRITE')
            ? { allowed: false, errorCode: 'LEGACY_WRITE_FROZEN' }
            : { allowed: true },
      },
    });
    const result = await handler.execute({
      jobId: 'ReconcileProgramDurationsTask',
      input: undefined,
      execute: () => {
        called = true;
      },
    });
    expect(called).toBe(false);
    expect(result).toMatchObject({
      outcome: 'SKIPPED',
      error: { code: 'LEGACY_WRITE_FROZEN', retryable: false },
    });
  });

  it('fails closed for an unregistered job without invoking caller code', async () => {
    let called = false;
    const handler = new CompatibilityLegacyJobHandler();
    const result = await handler.execute({
      jobId: 'not-registered',
      input: undefined,
      execute: () => {
        called = true;
      },
    });
    expect(called).toBe(false);
    expect(result).toEqual({
      outcome: 'FAILED',
      jobId: 'not-registered',
      error: { code: 'COMPATIBILITY_UNAVAILABLE', retryable: false },
    });
  });
});
