import type { CompatibilityMode } from './CompatibilityMode.js';

export const CompatibilityCounterMetrics = [
  'LEGACY_FALLBACK_READS',
  'CANONICAL_READS',
  'MAPPING_LOOKUPS',
  'MAPPING_CREATIONS',
  'TOMBSTONE_LOOKUPS',
  'TOMBSTONE_HITS',
  'SHADOW_COMPARISONS',
  'SHADOW_MISMATCHES',
  'LEGACY_ROUTE_CALLS',
  'DEPRECATED_ROUTE_CALLS',
  'LEGACY_WRITE_ATTEMPTS',
  'FROZEN_WRITE_ATTEMPTS',
  'TEMPORARY_TRANSLATION_SUCCESSES',
  'TEMPORARY_TRANSLATION_FAILURES',
  'RECONCILIATION_ITEMS_COMPARED',
  'RECONCILIATION_EQUAL',
  'RECONCILIATION_REPAIRED',
  'RECONCILIATION_CONFLICTS',
  'RECONCILIATION_FAILED',
  'RECONCILIATION_RETRIES',
  'MAPPING_CONFLICTS',
  'LAZY_MAPPINGS',
  'UNMAPPED_LEGACY_IDS',
  'COMPATIBILITY_ERRORS',
  'LEGACY_JOB_EXECUTIONS',
  'LEGACY_OUTPUT_FALLBACKS',
] as const;

export type CompatibilityCounterMetric =
  (typeof CompatibilityCounterMetrics)[number];

export const CompatibilityGaugeMetrics = [
  'RECONCILIATION_QUEUE_DEPTH',
  'OLDEST_RECONCILIATION_FINDING_AGE_SECONDS',
] as const;

export type CompatibilityGaugeMetric =
  (typeof CompatibilityGaugeMetrics)[number];

export const CompatibilityTimingMetrics = [
  'COMPATIBILITY_LATENCY',
  'RECONCILIATION_DURATION',
] as const;

export type CompatibilityTimingMetric =
  (typeof CompatibilityTimingMetrics)[number];

export const CompatibilityMetricResults = [
  'SUCCESS',
  'FAILURE',
  'FALLBACK',
  'CONFLICT',
  'NOT_FOUND',
  'TOMBSTONED',
  'DEGRADED',
  'FROZEN',
  'SKIPPED',
] as const;

export type CompatibilityMetricResult =
  (typeof CompatibilityMetricResults)[number];

export type CompatibilityMetricDimensions = Readonly<{
  concept: string;
  entityType?: string;
  routeTemplate?: string;
  operation: string;
  mode: CompatibilityMode;
  result: CompatibilityMetricResult;
  applicationVersion?: string;
  sourceSchemaVersion?: string;
}>;

export interface CompatibilityMetrics {
  increment(
    metric: CompatibilityCounterMetric,

    dimensions: CompatibilityMetricDimensions,

    amount?: number,
  ): void;

  setGauge(
    metric: CompatibilityGaugeMetric,

    value: number,

    dimensions: CompatibilityMetricDimensions,
  ): void;

  observeMilliseconds(
    metric: CompatibilityTimingMetric,

    milliseconds: number,

    dimensions: CompatibilityMetricDimensions,
  ): void;
}
