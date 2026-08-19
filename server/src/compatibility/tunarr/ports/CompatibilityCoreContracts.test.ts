import { describe, expect, it } from 'vitest';

import {
  CompatibilityCounterMetrics,
  CompatibilityErrorCodes,
  CompatibilityGaugeMetrics,
  CompatibilityMetricResults,
  CompatibilityModes,
  CompatibilityTimingMetrics,
  CompatibilityWriteStates,
  isCompatibilityMode,
  isCompatibilityReadValue,
  type CompatibilityErrorDescriptor,
  type CompatibilityMetricDimensions,
  type CompatibilityMetrics,
  type CompatibilityReadResult,
  type CompatibilityWriteStatus,
} from './index.js';

class RecordingCompatibilityMetrics implements CompatibilityMetrics {
  readonly calls: string[] = [];

  increment(
    metric: (typeof CompatibilityCounterMetrics)[number],
    _dimensions: CompatibilityMetricDimensions,
    amount = 1,
  ): void {
    this.calls.push(`counter:${metric}:${amount}`);
  }

  setGauge(
    metric: (typeof CompatibilityGaugeMetrics)[number],
    value: number,
    _dimensions: CompatibilityMetricDimensions,
  ): void {
    this.calls.push(`gauge:${metric}:${value}`);
  }

  observeMilliseconds(
    metric: (typeof CompatibilityTimingMetrics)[number],
    milliseconds: number,
    _dimensions: CompatibilityMetricDimensions,
  ): void {
    this.calls.push(`timing:${metric}:${milliseconds}`);
  }
}

describe('M04 compatibility core contracts', () => {
  it('defines the roadmap compatibility modes exactly', () => {
    expect(CompatibilityModes).toEqual([
      'LEGACY_ONLY',
      'LEGACY_READ_CANONICAL_WRITE',
      'CANONICAL_READ_LEGACY_FALLBACK',
      'CANONICAL_ONLY',
      'DUAL_COMPARE',
      'TEMPORARY_WRITE_TRANSLATION',
      'FROZEN_LEGACY_WRITE',
      'RETIRED',
    ]);

    expect(isCompatibilityMode('LEGACY_ONLY')).toBe(true);
    expect(isCompatibilityMode('RETIRED')).toBe(true);
    expect(isCompatibilityMode('UNKNOWN')).toBe(false);
  });

  it('represents canonical, legacy fallback, conflict, and not-found reads', () => {
    const canonical: CompatibilityReadResult<{
      id: string;
    }> = {
      source: 'CANONICAL',
      value: {
        id: 'canonical-id',
      },
      mappingId: 'mapping-id',
    };

    const fallback: CompatibilityReadResult<{
      id: string;
    }> = {
      source: 'LEGACY_FALLBACK',
      value: {
        id: 'translated-id',
      },
      warningCodes: ['LEGACY_DEFAULT_APPLIED'],
    };

    const conflict: CompatibilityReadResult<never> = {
      source: 'CONFLICT',
      conflictId: 'conflict-id',
    };

    const notFound: CompatibilityReadResult<never> = {
      source: 'NOT_FOUND',
    };

    expect(isCompatibilityReadValue(canonical)).toBe(true);
    expect(isCompatibilityReadValue(fallback)).toBe(true);
    expect(isCompatibilityReadValue(conflict)).toBe(false);
    expect(isCompatibilityReadValue(notFound)).toBe(false);
  });

  it('defines compatibility write status without creating dual authority', () => {
    expect(CompatibilityWriteStates).toEqual([
      'CURRENT',
      'PENDING',
      'DEGRADED',
      'FAILED',
      'CONFLICT',
      'FROZEN',
      'RETIRED',
    ]);

    const degraded: CompatibilityWriteStatus = {
      state: 'DEGRADED',
      reconciliationRequired: true,
      errorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
    };

    const frozen: CompatibilityWriteStatus = {
      state: 'FROZEN',
      errorCode: 'LEGACY_WRITE_FROZEN',
    };

    expect(degraded.reconciliationRequired).toBe(true);
    expect(frozen.errorCode).toBe('LEGACY_WRITE_FROZEN');
  });

  it('uses stable compatibility error codes without exposing raw implementation errors', () => {
    expect(CompatibilityErrorCodes).toEqual([
      'COMPATIBILITY_UNAVAILABLE',
      'COMPATIBILITY_TRANSLATION_FAILED',
      'COMPATIBILITY_CONFLICT',
      'LEGACY_WRITE_FROZEN',
    ]);

    const conflict: CompatibilityErrorDescriptor = {
      code: 'COMPATIBILITY_CONFLICT',
      retryable: false,
      conflictId: 'conflict-id',
    };

    const frozen: CompatibilityErrorDescriptor = {
      code: 'LEGACY_WRITE_FROZEN',
      retryable: false,
      replacement: '/api/v1/channels',
    };

    expect(conflict.code).toBe('COMPATIBILITY_CONFLICT');
    expect(frozen.code).toBe('LEGACY_WRITE_FROZEN');
    expect('stack' in conflict).toBe(false);
    expect('cause' in conflict).toBe(false);
  });

  it('exposes bounded metric dimensions and typed counter, gauge, and latency operations', () => {
    expect(CompatibilityCounterMetrics).toContain('LEGACY_FALLBACK_READS');
    expect(CompatibilityCounterMetrics).toContain('CANONICAL_READS');
    expect(CompatibilityCounterMetrics).toContain('MAPPING_LOOKUPS');
    expect(CompatibilityCounterMetrics).toContain('MAPPING_CONFLICTS');
    expect(CompatibilityCounterMetrics).toContain('TOMBSTONE_LOOKUPS');
    expect(CompatibilityCounterMetrics).toContain('TOMBSTONE_HITS');
    expect(CompatibilityGaugeMetrics).toEqual([
      'RECONCILIATION_QUEUE_DEPTH',
      'OLDEST_RECONCILIATION_FINDING_AGE_SECONDS',
    ]);
    expect(CompatibilityTimingMetrics).toEqual(['COMPATIBILITY_LATENCY']);

    expect(CompatibilityMetricResults).toEqual([
      'SUCCESS',
      'FAILURE',
      'FALLBACK',
      'CONFLICT',
      'NOT_FOUND',
      'TOMBSTONED',
      'DEGRADED',
      'FROZEN',
      'SKIPPED',
    ]);

    const dimensions: CompatibilityMetricDimensions = {
      concept: 'instance-identity',
      entityType: 'instance',
      operation: 'read',
      mode: 'LEGACY_ONLY',
      result: 'SUCCESS',
      applicationVersion: 'test',
      sourceSchemaVersion: '5',
    };

    expect(Object.keys(dimensions)).not.toContain('legacyId');
    expect(Object.keys(dimensions)).not.toContain('channelForgeId');

    const metrics = new RecordingCompatibilityMetrics();

    metrics.increment('LEGACY_FALLBACK_READS', dimensions);
    metrics.setGauge('RECONCILIATION_QUEUE_DEPTH', 2, dimensions);
    metrics.observeMilliseconds('COMPATIBILITY_LATENCY', 12.5, dimensions);

    expect(metrics.calls).toEqual([
      'counter:LEGACY_FALLBACK_READS:1',
      'gauge:RECONCILIATION_QUEUE_DEPTH:2',
      'timing:COMPATIBILITY_LATENCY:12.5',
    ]);
  });
});
