import { describe, expect, it } from 'vitest';

import { RuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';

import { ShadowReadDiagnostics } from './ShadowReadDiagnostics.js';

import {
  ShadowReadFramework,
  type ShadowReadDifferenceClass,
  type ShadowReadObservation,
} from './ShadowReadFramework.js';

function value<T>(entry: T): ShadowReadObservation<T> {
  return Object.freeze({
    kind: 'VALUE',
    value: entry,
  });
}

describe('ShadowReadFramework', () => {
  it('compares canonical representations without changing the designated authority', () => {
    const metrics = new RuntimeCompatibilityMetrics();

    const diagnostics = new ShadowReadDiagnostics();

    const framework = new ShadowReadFramework(
      metrics,
      diagnostics,
      () => new Date('2026-08-19T10:30:00.000Z'),
      () => 25,
    );

    const legacy = value({
      name: 'Channel 7',
      number: 7,
    });

    const canonical = value({
      number: 7,
      name: 'Channel 7',
    });

    const result = framework.compare({
      concept: 'channel-read-model',

      entityType: 'channel',

      authority: 'CANONICAL',

      legacy,

      canonical,

      operation: 'shadow-channel-read',

      routeTemplate: '/api/channels/:id',

      correlationId: 'corr-04e',

      applicationVersion: '04e-test',

      sourceSchemaVersion: '6',
    });

    expect(result.status).toBe('COMPARED');

    if (result.status !== 'COMPARED') {
      throw new Error('comparison unexpectedly skipped');
    }

    expect(result.authoritativeObservation).toBe(canonical);

    expect(result.finding).toMatchObject({
      concept: 'channel-read-model',

      authority: 'CANONICAL',

      differenceClass: 'EQUAL',

      severity: 'INFO',

      correlationId: 'corr-04e',

      timestamp: '2026-08-19T10:30:00.000Z',
    });

    expect(result.finding.legacyChecksum).toBe(
      result.finding.canonicalChecksum,
    );

    const snapshot = metrics.snapshot();

    expect(
      snapshot.counters.some(
        (entry) =>
          entry.metric === 'SHADOW_COMPARISONS' &&
          entry.dimensions.result === 'SUCCESS' &&
          entry.value === 1,
      ),
    ).toBe(true);

    expect(
      snapshot.counters.some((entry) => entry.metric === 'SHADOW_MISMATCHES'),
    ).toBe(false);

    for (const entry of snapshot.counters) {
      expect(Object.keys(entry.dimensions)).not.toContain('correlationId');
    }

    expect(diagnostics.snapshot().findings).toHaveLength(1);
  });

  it.each([
    ['EXPECTED_FORMATTING_DIFFERENCE', 'INFO', 'DEGRADED'],
    ['EXPECTED_SEMANTIC_DIFFERENCE', 'WARNING', 'DEGRADED'],
    ['IDENTITY_MISMATCH', 'CRITICAL', 'FAILURE'],
    ['VALUE_MISMATCH', 'ERROR', 'FAILURE'],
    ['ORDER_MISMATCH', 'ERROR', 'FAILURE'],
  ] as const)(
    'records classified value difference %s',
    (differenceClass, severity, metricResult) => {
      const metrics = new RuntimeCompatibilityMetrics();

      const framework = new ShadowReadFramework(metrics);

      const result = framework.compare({
        concept: 'comparison-proof',

        authority: 'LEGACY',

        legacy: value(['a', 'b']),

        canonical: value(['b', 'a']),

        operation: 'shadow-proof',

        classifyValueDifference: () =>
          differenceClass as ShadowReadDifferenceClass,
      });

      expect(result.status).toBe('COMPARED');

      if (result.status !== 'COMPARED') {
        throw new Error('comparison unexpectedly skipped');
      }

      expect(result.finding.differenceClass).toBe(differenceClass);

      expect(result.finding.severity).toBe(severity);

      expect(
        metrics
          .snapshot()
          .counters.some(
            (entry) =>
              entry.metric === 'SHADOW_MISMATCHES' &&
              entry.dimensions.result === metricResult,
          ),
      ).toBe(true);
    },
  );

  it('classifies missing and error observations without exposing raw errors', () => {
    const framework = new ShadowReadFramework(
      new RuntimeCompatibilityMetrics(),
    );

    const legacyMissing = framework.compare({
      concept: 'missing-proof',

      authority: 'CANONICAL',

      legacy: Object.freeze({
        kind: 'MISSING',
      }),

      canonical: value({
        id: 'canonical',
      }),

      operation: 'shadow-missing',
    });

    expect(legacyMissing.status).toBe('COMPARED');

    if (legacyMissing.status === 'COMPARED') {
      expect(legacyMissing.finding.differenceClass).toBe('LEGACY_MISSING');

      expect(legacyMissing.finding.legacyChecksum).toBeNull();
    }

    const errorMismatch = framework.compare({
      concept: 'error-proof',

      authority: 'LEGACY',

      legacy: Object.freeze({
        kind: 'ERROR',
        errorCode: 'LEGACY_NOT_READY',
      }),

      canonical: Object.freeze({
        kind: 'ERROR',
        errorCode: 'CANONICAL_NOT_READY',
      }),

      operation: 'shadow-error',
    });

    expect(errorMismatch.status).toBe('COMPARED');

    if (errorMismatch.status === 'COMPARED') {
      expect(errorMismatch.finding.differenceClass).toBe('ERROR_MISMATCH');

      expect(JSON.stringify(errorMismatch.finding)).not.toContain(
        'LEGACY_NOT_READY',
      );
    }
  });

  it('supports deterministic sampling and records sampled-out work as skipped', () => {
    const metrics = new RuntimeCompatibilityMetrics();

    const framework = new ShadowReadFramework(metrics);

    const result = framework.compare({
      concept: 'high-volume-channel-list',

      authority: 'LEGACY',

      legacy: value({
        count: 12,
      }),

      canonical: value({
        count: 12,
      }),

      operation: 'shadow-channel-list',

      correlationId: 'sample-correlation',

      sampling: Object.freeze({
        enabled: true,
        sampleRate: 0,
      }),
    });

    expect(result).toMatchObject({
      status: 'SKIPPED',

      reason: 'SAMPLED_OUT',

      authority: 'LEGACY',
    });

    expect(
      metrics
        .snapshot()
        .counters.some(
          (entry) =>
            entry.metric === 'SHADOW_COMPARISONS' &&
            entry.dimensions.result === 'SKIPPED',
        ),
    ).toBe(true);
  });

  it('prohibits sampling for critical identity validation', () => {
    const framework = new ShadowReadFramework(
      new RuntimeCompatibilityMetrics(),
    );

    expect(() =>
      framework.compare({
        concept: 'instance-identity',

        authority: 'CANONICAL',

        legacy: value({
          id: 'legacy',
        }),

        canonical: value({
          id: 'canonical',
        }),

        operation: 'shadow-instance-identity',

        correlationId: 'critical-identity',

        sampling: Object.freeze({
          enabled: true,
          sampleRate: 0.5,
          criticalIdentity: true,
        }),
      }),
    ).toThrow('Critical identity shadow validation must not be sampled');
  });

  it('is disableable and cancelable without changing authority', () => {
    const metrics = new RuntimeCompatibilityMetrics();

    const framework = new ShadowReadFramework(metrics);

    const canonical = value({
      value: 1,
    });

    const disabled = framework.compare({
      concept: 'disable-proof',

      authority: 'CANONICAL',

      legacy: value({
        value: 2,
      }),

      canonical,

      operation: 'shadow-disable',

      sampling: Object.freeze({
        enabled: false,
        sampleRate: 1,
      }),
    });

    expect(disabled).toMatchObject({
      status: 'SKIPPED',

      reason: 'DISABLED',
    });

    expect(disabled.authoritativeObservation).toBe(canonical);

    const controller = new AbortController();

    controller.abort();

    const aborted = framework.compare({
      concept: 'cancel-proof',

      authority: 'CANONICAL',

      legacy: value({
        value: 2,
      }),

      canonical,

      operation: 'shadow-cancel',

      signal: controller.signal,
    });

    expect(aborted).toMatchObject({
      status: 'SKIPPED',

      reason: 'ABORTED',
    });
  });

  it('classifies oversized representations as UNKNOWN instead of retaining payloads', () => {
    const diagnostics = new ShadowReadDiagnostics();

    const framework = new ShadowReadFramework(
      new RuntimeCompatibilityMetrics(),
      diagnostics,
    );

    const raw = 'sensitive-payload-'.repeat(20);

    const result = framework.compare({
      concept: 'bounded-proof',

      authority: 'LEGACY',

      legacy: value({
        raw,
      }),

      canonical: value({
        raw: `${raw}different`,
      }),

      operation: 'shadow-bounded',

      maxSerializedBytes: 32,
    });

    expect(result.status).toBe('COMPARED');

    if (result.status === 'COMPARED') {
      expect(result.finding.differenceClass).toBe('UNKNOWN');
    }

    expect(JSON.stringify(diagnostics.snapshot())).not.toContain(
      'sensitive-payload',
    );
  });
});
