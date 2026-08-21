import type { CompatibilityErrorDescriptor } from '../ports/CompatibilityErrors.js';
import type {
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
} from '../ports/CompatibilityMetrics.js';
import type { CompatibilityMode } from '../ports/CompatibilityMode.js';
import {
  tunarrLegacyWriteFreezeRegistry,
  type LegacyWriteFreezeEntry,
  type LegacyWriteFreezeRegistry,
  type LegacyWritePathId,
} from './LegacyWriteFreezeRegistry.js';

export type CompatibilityLegacyWriteGuardRequest = Readonly<{
  writePath: LegacyWritePathId;
  mode?: CompatibilityMode;
}>;

export type CompatibilityLegacyWriteGuardDecision =
  | Readonly<{
      allowed: true;
      entry: LegacyWriteFreezeEntry;
    }>
  | Readonly<{
      allowed: false;
      entry?: LegacyWriteFreezeEntry;
      error: CompatibilityErrorDescriptor;
    }>;

export type CompatibilityLegacyWriteGuardOptions = Readonly<{
  registry?: LegacyWriteFreezeRegistry;
  metrics?: CompatibilityMetrics;
}>;

export class CompatibilityLegacyWriteGuard {
  private readonly registry: LegacyWriteFreezeRegistry;
  private readonly metrics?: CompatibilityMetrics;

  constructor(options: CompatibilityLegacyWriteGuardOptions = {}) {
    this.registry = options.registry ?? tunarrLegacyWriteFreezeRegistry;
    this.metrics = options.metrics;
  }

  evaluate(
    request: CompatibilityLegacyWriteGuardRequest,
  ): CompatibilityLegacyWriteGuardDecision {
    const entry = this.registry.get(request.writePath);

    if (entry === undefined) {
      return Object.freeze({
        allowed: false,
        error: Object.freeze({
          code: 'COMPATIBILITY_UNAVAILABLE',
          retryable: false,
        }),
      });
    }

    if (entry.state === 'ACTIVE') {
      return Object.freeze({ allowed: true, entry });
    }

    this.recordFrozenAttempt(entry, request.mode ?? 'FROZEN_LEGACY_WRITE');

    return Object.freeze({
      allowed: false,
      entry,
      error: Object.freeze({
        code: 'LEGACY_WRITE_FROZEN',
        retryable: false,
        ...(entry.replacement === undefined
          ? {}
          : { replacement: entry.replacement }),
      }),
    });
  }

  private recordFrozenAttempt(
    entry: LegacyWriteFreezeEntry,
    mode: CompatibilityMode,
  ): void {
    if (this.metrics === undefined) return;

    const dimensions: CompatibilityMetricDimensions = {
      concept: entry.concept,
      entityType: 'legacy-write-path',
      operation: entry.writePath,
      mode,
      result: 'FROZEN',
    };

    try {
      this.metrics.increment('FROZEN_WRITE_ATTEMPTS', dimensions);
    } catch {
      // Freeze enforcement cannot depend on observability availability.
    }
  }
}
