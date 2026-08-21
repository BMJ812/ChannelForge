import { describe, expect, it } from 'vitest';

import type {
  CompatibilityCounterMetric,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
  CompatibilityTimingMetric,
} from '../ports/CompatibilityMetrics.js';
import {
  CompatibilitySchedulerModes,
  createCompatibilitySchedulerModeTransition,
  type CompatibilityScheduleComparisonEntry,
  type CompatibilitySchedulingRequest,
} from '../ports/CompatibilityScheduling.js';
import {
  CompatibilitySchedulingBoundary,
  compareCompatibilityScheduleProjections,
} from './CompatibilitySchedulingBoundary.js';

type Artifact = Readonly<{
  name: string;
  entries: readonly CompatibilityScheduleComparisonEntry[];
}>;

type Plan = Readonly<{
  planId: string;
}>;

type CounterCall = Readonly<{
  metric: CompatibilityCounterMetric;
  dimensions: CompatibilityMetricDimensions;
  amount: number;
}>;

class RecordingMetrics implements CompatibilityMetrics {
  readonly counters: CounterCall[] = [];

  increment(
    metric: CompatibilityCounterMetric,
    dimensions: CompatibilityMetricDimensions,
    amount = 1,
  ): void {
    this.counters.push({ metric, dimensions, amount });
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

const horizon = Object.freeze({ startTimeMs: 0, endTimeMs: 60_000 });
const tolerance = Object.freeze({
  startTimeToleranceMs: 250,
  durationToleranceMs: 250,
});

function entry(
  contentIdentity: string,
  overrides: Partial<CompatibilityScheduleComparisonEntry> = {},
): CompatibilityScheduleComparisonEntry {
  return Object.freeze({
    contentIdentity,
    startTimeMs: 1_000,
    durationMs: 10_000,
    kind: 'CONTENT',
    ...overrides,
  });
}

const canonicalArtifact: Artifact = Object.freeze({
  name: 'canonical',
  entries: Object.freeze([entry('program-a')]),
});

const legacyArtifact: Artifact = Object.freeze({
  name: 'legacy',
  entries: Object.freeze([entry('program-a')]),
});

function request(
  overrides: Partial<CompatibilitySchedulingRequest<Artifact, Plan>> = {},
): CompatibilitySchedulingRequest<Artifact, Plan> {
  return {
    channelForgeChannelId: 'channel-forge-channel',
    legacyChannelId: 'legacy-channel',
    scheduleVersion: 'schedule-v1',
    approvedSchedulePlan: Object.freeze({ planId: 'approved-plan' }),
    approvedScheduleArtifact: canonicalArtifact,
    scheduleOrigin: 'APPROVED_ARTIFACT',
    evaluationTimeMs: 1_000,
    comparisonHorizon: horizon,
    tolerancePolicy: tolerance,
    schedulerMode: 'CANONICAL_AUTHORITATIVE',
    fallbackPolicy: Object.freeze({ allowLegacyFallback: false }),
    ...overrides,
  };
}

function projector() {
  return {
    projectSchedule(artifact: Artifact) {
      return artifact.entries;
    },
  };
}

describe('M04 scheduling compatibility boundary', () => {
  it('defines the roadmap scheduler modes exactly', () => {
    expect(CompatibilitySchedulerModes).toEqual([
      'LEGACY_AUTHORITATIVE',
      'SHADOW_CANONICAL',
      'CANONICAL_AUTHORITATIVE',
      'FROZEN',
    ]);
  });

  it('never reads legacy scheduling when canonical authority is healthy', async () => {
    let legacyReads = 0;
    const metrics = new RecordingMetrics();
    const boundary = new CompatibilitySchedulingBoundary<Artifact>({
      metrics,
      legacyReader: {
        async readLegacySchedule() {
          legacyReads += 1;
          return legacyArtifact;
        },
      },
      comparisonProjector: projector(),
    });

    const result = await boundary.resolve(
      request({
        fallbackPolicy: Object.freeze({
          allowLegacyFallback: true,
          reason: 'Explicit degraded-state safety net',
        }),
      }),
    );

    expect(result.outcome).toBe('RESOLVED');
    if (result.outcome !== 'RESOLVED') {
      throw new Error('Expected resolved schedule.');
    }

    expect(result.effectiveScheduleArtifact).toBe(canonicalArtifact);
    expect(result.compatibilityStatus).toBe('CURRENT');
    expect(result.shadowComparison).toEqual({ result: 'NOT_RUN' });
    expect(legacyReads).toBe(0);
    expect(metrics.counters.map((call) => call.metric)).toEqual([
      'CANONICAL_READS',
    ]);
  });

  it('uses legacy only under explicit degraded fallback and records bounded metrics', async () => {
    const metrics = new RecordingMetrics();
    const boundary = new CompatibilitySchedulingBoundary<Artifact>({
      metrics,
      legacyReader: {
        async readLegacySchedule() {
          return legacyArtifact;
        },
      },
    });

    const result = await boundary.resolve(
      request({
        approvedScheduleArtifact: undefined,
        fallbackPolicy: Object.freeze({
          allowLegacyFallback: true,
          reason: 'Canonical artifact unavailable',
        }),
      }),
    );

    expect(result.outcome).toBe('RESOLVED');
    if (result.outcome !== 'RESOLVED') {
      throw new Error('Expected degraded legacy fallback.');
    }

    expect(result.effectiveScheduleArtifact).toBe(legacyArtifact);
    expect(result.compatibilityStatus).toBe('DEGRADED');
    expect(result.degradedReason).toBe('CANONICAL_ARTIFACT_UNAVAILABLE');
    expect(result.scheduleOrigin).toBe('LEGACY_COMPATIBILITY');
    expect(metrics.counters.map((call) => call.metric)).toEqual([
      'LEGACY_SCHEDULE_READS',
      'LEGACY_SCHEDULE_FALLBACKS',
    ]);

    for (const call of metrics.counters) {
      expect(Object.keys(call.dimensions)).not.toContain('legacyChannelId');
      expect(Object.keys(call.dimensions)).not.toContain(
        'channelForgeChannelId',
      );
      expect(JSON.stringify(call.dimensions)).not.toContain('legacy-channel');
      expect(JSON.stringify(call.dimensions)).not.toContain(
        'channel-forge-channel',
      );
    }
  });

  it('does not invoke legacy scheduling when degraded fallback is disabled', async () => {
    let legacyReads = 0;
    const boundary = new CompatibilitySchedulingBoundary<Artifact>({
      legacyReader: {
        async readLegacySchedule() {
          legacyReads += 1;
          return legacyArtifact;
        },
      },
    });

    const result = await boundary.resolve(
      request({ approvedScheduleArtifact: undefined }),
    );

    expect(result).toMatchObject({
      outcome: 'UNAVAILABLE',
      compatibilityStatus: 'FAILED',
      failureReason: 'CANONICAL_ARTIFACT_UNAVAILABLE',
    });
    expect(legacyReads).toBe(0);
  });

  it('keeps canonical authority during equal and divergent shadow comparisons', async () => {
    const metrics = new RecordingMetrics();
    let currentLegacy = legacyArtifact;
    const boundary = new CompatibilitySchedulingBoundary<Artifact>({
      metrics,
      legacyReader: {
        async readLegacySchedule() {
          return currentLegacy;
        },
      },
      comparisonProjector: projector(),
    });

    const equalResult = await boundary.resolve(
      request({ schedulerMode: 'SHADOW_CANONICAL' }),
    );
    expect(equalResult.outcome).toBe('RESOLVED');
    if (equalResult.outcome !== 'RESOLVED') {
      throw new Error('Expected equal shadow result.');
    }
    expect(equalResult.effectiveScheduleArtifact).toBe(canonicalArtifact);
    expect(equalResult.shadowComparison).toEqual({
      result: 'EQUAL',
      comparedEntries: 1,
    });

    currentLegacy = Object.freeze({
      name: 'legacy-divergent',
      entries: Object.freeze([entry('different-program')]),
    });
    const divergentResult = await boundary.resolve(
      request({ schedulerMode: 'SHADOW_CANONICAL' }),
    );
    expect(divergentResult.outcome).toBe('RESOLVED');
    if (divergentResult.outcome !== 'RESOLVED') {
      throw new Error('Expected divergent shadow result.');
    }
    expect(divergentResult.effectiveScheduleArtifact).toBe(canonicalArtifact);
    expect(divergentResult.shadowComparison.result).toBe('DIVERGED');
    expect(metrics.counters.map((call) => call.metric)).toContain(
      'SCHEDULE_SHADOW_DIVERGENCES',
    );
  });

  it('classifies ordering, time, duration, identity, filler, and redirect divergence', () => {
    const ordering = compareCompatibilityScheduleProjections(
      [entry('a'), entry('b', { startTimeMs: 12_000 })],
      [entry('b'), entry('a', { startTimeMs: 12_000 })],
      horizon,
      tolerance,
    );
    expect(ordering.result).toBe('DIVERGED');
    if (ordering.result === 'DIVERGED') {
      expect(ordering.divergence.codes).toContain('ORDERING');
    }

    const timing = compareCompatibilityScheduleProjections(
      [entry('a', { startTimeMs: 1_000, durationMs: 10_000 })],
      [entry('a', { startTimeMs: 2_000, durationMs: 12_000 })],
      horizon,
      tolerance,
    );
    expect(timing.result).toBe('DIVERGED');
    if (timing.result === 'DIVERGED') {
      expect(timing.divergence.codes).toContain('START_TIME');
      expect(timing.divergence.codes).toContain('DURATION');
    }

    const identity = compareCompatibilityScheduleProjections(
      [entry('a')],
      [entry('different')],
      horizon,
      tolerance,
    );
    expect(identity.result).toBe('DIVERGED');
    if (identity.result === 'DIVERGED') {
      expect(identity.divergence.codes).toContain('CONTENT_IDENTITY');
    }

    const filler = compareCompatibilityScheduleProjections(
      [entry('a')],
      [entry('filler-a', { kind: 'FILLER' })],
      horizon,
      tolerance,
    );
    expect(filler.result).toBe('DIVERGED');
    if (filler.result === 'DIVERGED') {
      expect(filler.divergence.codes).toContain('FILLER_INSERTION');
    }

    const redirect = compareCompatibilityScheduleProjections(
      [
        entry('redirect', {
          kind: 'REDIRECT',
          redirectTargetIdentity: 'channel-a',
        }),
      ],
      [
        entry('redirect', {
          kind: 'REDIRECT',
          redirectTargetIdentity: 'channel-b',
        }),
      ],
      horizon,
      tolerance,
    );
    expect(redirect.result).toBe('DIVERGED');
    if (redirect.result === 'DIVERGED') {
      expect(redirect.divergence.codes).toContain('REDIRECT');
    }
  });

  it('supports explicit legacy authority and contains legacy scheduling when frozen', async () => {
    let legacyReads = 0;
    const plan = Object.freeze({ planId: 'immutable-plan' });
    const boundary = new CompatibilitySchedulingBoundary<Artifact>({
      legacyReader: {
        async readLegacySchedule() {
          legacyReads += 1;
          return legacyArtifact;
        },
      },
    });

    const legacyResult = await boundary.resolve(
      request({
        approvedSchedulePlan: plan,
        schedulerMode: 'LEGACY_AUTHORITATIVE',
      }),
    );
    expect(legacyResult.outcome).toBe('RESOLVED');
    if (legacyResult.outcome !== 'RESOLVED') {
      throw new Error('Expected legacy-authoritative result.');
    }
    expect(legacyResult.effectiveScheduleArtifact).toBe(legacyArtifact);
    expect(legacyResult.scheduleOrigin).toBe('LEGACY_COMPATIBILITY');
    expect(plan).toEqual({ planId: 'immutable-plan' });

    const frozenResult = await boundary.resolve(
      request({ schedulerMode: 'FROZEN' }),
    );
    expect(frozenResult.outcome).toBe('RESOLVED');
    if (frozenResult.outcome !== 'RESOLVED') {
      throw new Error('Expected frozen canonical result.');
    }
    expect(frozenResult.effectiveScheduleArtifact).toBe(canonicalArtifact);
    expect(frozenResult.compatibilityStatus).toBe('FROZEN');
    expect(legacyReads).toBe(1);
  });

  it('requires scheduler mode changes to be explicit and auditable', () => {
    const transition = createCompatibilitySchedulerModeTransition({
      transitionId: 'transition-1',
      from: 'SHADOW_CANONICAL',
      to: 'CANONICAL_AUTHORITATIVE',
      actor: 'operator',
      reason: 'Shadow comparison gate satisfied',
      occurredAt: '2026-08-20T12:00:00.000Z',
    });

    expect(Object.isFrozen(transition)).toBe(true);
    expect(() =>
      createCompatibilitySchedulerModeTransition({
        ...transition,
        transitionId: 'transition-2',
        from: 'CANONICAL_AUTHORITATIVE',
        to: 'CANONICAL_AUTHORITATIVE',
      }),
    ).toThrow('must change mode');
  });
});
