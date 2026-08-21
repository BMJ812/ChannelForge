import type {
  CompatibilityMetricDimensions,
  CompatibilityMetricResult,
  CompatibilityMetrics,
} from '../ports/CompatibilityMetrics.js';
import type { CompatibilityMode } from '../ports/CompatibilityMode.js';
import {
  CompatibilityScheduleDivergenceCodes,
  CompatibilitySchedulerModes,
  type CompatibilityLegacyScheduleReader,
  type CompatibilityScheduleComparisonEntry,
  type CompatibilityScheduleComparisonHorizon,
  type CompatibilityScheduleComparisonProjector,
  type CompatibilityScheduleDivergence,
  type CompatibilityScheduleDivergenceCode,
  type CompatibilityScheduleShadowComparison,
  type CompatibilityScheduleTolerancePolicy,
  type CompatibilitySchedulingRequest,
  type CompatibilitySchedulingResult,
  type CompatibilitySchedulingUnavailableResult,
} from '../ports/CompatibilityScheduling.js';

export type CompatibilitySchedulingBoundaryOptions<TArtifact> = Readonly<{
  legacyReader?: CompatibilityLegacyScheduleReader<TArtifact>;
  comparisonProjector?: CompatibilityScheduleComparisonProjector<TArtifact>;
  metrics?: CompatibilityMetrics;
}>;

function assertFiniteNumber(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${field} must be finite.`);
  }
}

function assertComparisonPolicy(
  horizon: CompatibilityScheduleComparisonHorizon,
  tolerance: CompatibilityScheduleTolerancePolicy,
): void {
  assertFiniteNumber(horizon.startTimeMs, 'comparisonHorizon.startTimeMs');
  assertFiniteNumber(horizon.endTimeMs, 'comparisonHorizon.endTimeMs');

  if (horizon.endTimeMs <= horizon.startTimeMs) {
    throw new RangeError(
      'comparisonHorizon.endTimeMs must be greater than startTimeMs.',
    );
  }

  assertFiniteNumber(
    tolerance.startTimeToleranceMs,
    'tolerancePolicy.startTimeToleranceMs',
  );
  assertFiniteNumber(
    tolerance.durationToleranceMs,
    'tolerancePolicy.durationToleranceMs',
  );

  if (tolerance.startTimeToleranceMs < 0 || tolerance.durationToleranceMs < 0) {
    throw new RangeError(
      'Schedule comparison tolerances must be non-negative.',
    );
  }
}

function assertComparisonEntry(
  entry: CompatibilityScheduleComparisonEntry,
): void {
  if (entry.contentIdentity.trim().length === 0) {
    throw new Error('Schedule comparison content identity must be non-empty.');
  }

  assertFiniteNumber(entry.startTimeMs, 'scheduleEntry.startTimeMs');
  assertFiniteNumber(entry.durationMs, 'scheduleEntry.durationMs');

  if (entry.durationMs < 0) {
    throw new RangeError('Schedule comparison duration must be non-negative.');
  }

  if (
    entry.kind === 'REDIRECT' &&
    (entry.redirectTargetIdentity === undefined ||
      entry.redirectTargetIdentity.trim().length === 0)
  ) {
    throw new Error('Redirect schedule entries require a target identity.');
  }
}

function entriesInHorizon(
  entries: readonly CompatibilityScheduleComparisonEntry[],
  horizon: CompatibilityScheduleComparisonHorizon,
): readonly CompatibilityScheduleComparisonEntry[] {
  return entries.filter((entry) => {
    assertComparisonEntry(entry);
    const endTimeMs = entry.startTimeMs + entry.durationMs;
    return (
      entry.startTimeMs < horizon.endTimeMs && endTimeMs > horizon.startTimeMs
    );
  });
}

function sequencesEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function multisetsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const counts = new Map<string, number>();
  for (const value of left) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  for (const value of right) {
    const count = counts.get(value) ?? 0;
    if (count === 0) {
      return false;
    }

    if (count === 1) {
      counts.delete(value);
    } else {
      counts.set(value, count - 1);
    }
  }

  return counts.size === 0;
}

function orderedCodes(
  codes: ReadonlySet<CompatibilityScheduleDivergenceCode>,
): readonly CompatibilityScheduleDivergenceCode[] {
  return Object.freeze(
    CompatibilityScheduleDivergenceCodes.filter((code) => codes.has(code)),
  );
}

export function compareCompatibilityScheduleProjections(
  canonicalEntries: readonly CompatibilityScheduleComparisonEntry[],
  legacyEntries: readonly CompatibilityScheduleComparisonEntry[],
  horizon: CompatibilityScheduleComparisonHorizon,
  tolerance: CompatibilityScheduleTolerancePolicy,
): CompatibilityScheduleShadowComparison {
  assertComparisonPolicy(horizon, tolerance);

  const canonical = entriesInHorizon(canonicalEntries, horizon);
  const legacy = entriesInHorizon(legacyEntries, horizon);
  const codes = new Set<CompatibilityScheduleDivergenceCode>();

  const canonicalIdentities = canonical.map((entry) => entry.contentIdentity);
  const legacyIdentities = legacy.map((entry) => entry.contentIdentity);

  if (!sequencesEqual(canonicalIdentities, legacyIdentities)) {
    if (multisetsEqual(canonicalIdentities, legacyIdentities)) {
      codes.add('ORDERING');
    } else {
      codes.add('CONTENT_IDENTITY');
    }
  }

  const canonicalFiller = canonical.map((entry) => entry.kind === 'FILLER');
  const legacyFiller = legacy.map((entry) => entry.kind === 'FILLER');
  if (!sequencesEqual(canonicalFiller.map(String), legacyFiller.map(String))) {
    codes.add('FILLER_INSERTION');
  }

  const canonicalRedirects = canonical.map((entry) =>
    entry.kind === 'REDIRECT'
      ? `REDIRECT:${entry.redirectTargetIdentity ?? ''}`
      : entry.kind,
  );
  const legacyRedirects = legacy.map((entry) =>
    entry.kind === 'REDIRECT'
      ? `REDIRECT:${entry.redirectTargetIdentity ?? ''}`
      : entry.kind,
  );
  if (!sequencesEqual(canonicalRedirects, legacyRedirects)) {
    if (
      canonical.some((entry) => entry.kind === 'REDIRECT') ||
      legacy.some((entry) => entry.kind === 'REDIRECT')
    ) {
      codes.add('REDIRECT');
    }
  }

  const pairedCount = Math.min(canonical.length, legacy.length);
  for (let index = 0; index < pairedCount; index += 1) {
    const canonicalEntry = canonical[index];
    const legacyEntry = legacy[index];

    if (canonicalEntry === undefined || legacyEntry === undefined) {
      continue;
    }

    if (
      Math.abs(canonicalEntry.startTimeMs - legacyEntry.startTimeMs) >
      tolerance.startTimeToleranceMs
    ) {
      codes.add('START_TIME');
    }

    if (
      Math.abs(canonicalEntry.durationMs - legacyEntry.durationMs) >
      tolerance.durationToleranceMs
    ) {
      codes.add('DURATION');
    }
  }

  if (codes.size === 0) {
    return Object.freeze({
      result: 'EQUAL',
      comparedEntries: Math.max(canonical.length, legacy.length),
    });
  }

  const divergence: CompatibilityScheduleDivergence = Object.freeze({
    codes: orderedCodes(codes),
    canonicalEntryCount: canonical.length,
    legacyEntryCount: legacy.length,
  });

  return Object.freeze({
    result: 'DIVERGED',
    comparedEntries: Math.max(canonical.length, legacy.length),
    divergence,
  });
}

function metricMode<TArtifact, TPlan>(
  request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
): CompatibilityMode {
  switch (request.schedulerMode) {
    case 'LEGACY_AUTHORITATIVE':
      return 'LEGACY_ONLY';
    case 'SHADOW_CANONICAL':
      return 'DUAL_COMPARE';
    case 'CANONICAL_AUTHORITATIVE':
      return request.fallbackPolicy.allowLegacyFallback
        ? 'CANONICAL_READ_LEGACY_FALLBACK'
        : 'CANONICAL_ONLY';
    case 'FROZEN':
      return 'FROZEN_LEGACY_WRITE';
  }
}

function assertRequest<TArtifact, TPlan>(
  request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
): void {
  if (
    !(CompatibilitySchedulerModes as readonly string[]).includes(
      request.schedulerMode,
    )
  ) {
    throw new Error(
      `Unsupported scheduler mode: ${String(request.schedulerMode)}`,
    );
  }

  for (const [field, value] of [
    ['channelForgeChannelId', request.channelForgeChannelId],
    ['scheduleVersion', request.scheduleVersion],
    ['scheduleOrigin', request.scheduleOrigin],
  ] as const) {
    if (value.trim().length === 0) {
      throw new Error(`${field} must be non-empty.`);
    }
  }

  assertFiniteNumber(request.evaluationTimeMs, 'evaluationTimeMs');
  assertComparisonPolicy(request.comparisonHorizon, request.tolerancePolicy);

  if (
    request.fallbackPolicy.allowLegacyFallback &&
    (request.fallbackPolicy.reason === undefined ||
      request.fallbackPolicy.reason.trim().length === 0)
  ) {
    throw new Error(
      'Enabled legacy schedule fallback requires an explicit reason.',
    );
  }
}

export class CompatibilitySchedulingBoundary<TArtifact> {
  private readonly legacyReader?: CompatibilityLegacyScheduleReader<TArtifact>;
  private readonly comparisonProjector?: CompatibilityScheduleComparisonProjector<TArtifact>;
  private readonly metrics?: CompatibilityMetrics;

  constructor(options: CompatibilitySchedulingBoundaryOptions<TArtifact>) {
    this.legacyReader = options.legacyReader;
    this.comparisonProjector = options.comparisonProjector;
    this.metrics = options.metrics;
  }

  async resolve<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
  ): Promise<CompatibilitySchedulingResult<TArtifact>> {
    assertRequest(request);
    this.throwIfAborted(request.signal);

    switch (request.schedulerMode) {
      case 'LEGACY_AUTHORITATIVE':
        return this.resolveLegacyAuthoritative(request);
      case 'SHADOW_CANONICAL':
        return this.resolveShadowCanonical(request);
      case 'CANONICAL_AUTHORITATIVE':
        return this.resolveCanonicalAuthoritative(request);
      case 'FROZEN':
        return this.resolveFrozen(request);
    }
  }

  private async resolveCanonicalAuthoritative<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
  ): Promise<CompatibilitySchedulingResult<TArtifact>> {
    if (request.approvedScheduleArtifact !== undefined) {
      this.recordCounter(
        request,
        'CANONICAL_READS',
        'canonical-read',
        'SUCCESS',
      );
      return Object.freeze({
        outcome: 'RESOLVED',
        effectiveScheduleArtifact: request.approvedScheduleArtifact,
        compatibilityStatus: 'CURRENT',
        schedulerMode: request.schedulerMode,
        scheduleVersion: request.scheduleVersion,
        scheduleOrigin: request.scheduleOrigin,
        shadowComparison: Object.freeze({ result: 'NOT_RUN' }),
      });
    }

    if (!request.fallbackPolicy.allowLegacyFallback) {
      return this.unavailable(request, 'CANONICAL_ARTIFACT_UNAVAILABLE');
    }

    if (request.legacyChannelId === undefined) {
      return this.unavailable(request, 'LEGACY_MAPPING_REQUIRED');
    }

    if (this.legacyReader === undefined) {
      return this.unavailable(request, 'LEGACY_READER_UNAVAILABLE');
    }

    const legacy = await this.readLegacy(request, request.legacyChannelId);
    if (legacy === undefined) {
      return this.unavailable(request, 'LEGACY_SCHEDULE_UNAVAILABLE');
    }

    this.recordCounter(
      request,
      'LEGACY_SCHEDULE_FALLBACKS',
      'legacy-schedule-fallback',
      'FALLBACK',
    );

    return Object.freeze({
      outcome: 'RESOLVED',
      effectiveScheduleArtifact: legacy,
      compatibilityStatus: 'DEGRADED',
      schedulerMode: request.schedulerMode,
      scheduleVersion: request.scheduleVersion,
      scheduleOrigin: 'LEGACY_COMPATIBILITY',
      shadowComparison: Object.freeze({ result: 'NOT_RUN' }),
      degradedReason: 'CANONICAL_ARTIFACT_UNAVAILABLE',
    });
  }

  private async resolveLegacyAuthoritative<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
  ): Promise<CompatibilitySchedulingResult<TArtifact>> {
    if (request.legacyChannelId === undefined) {
      return this.unavailable(request, 'LEGACY_MAPPING_REQUIRED');
    }

    if (this.legacyReader === undefined) {
      return this.unavailable(request, 'LEGACY_READER_UNAVAILABLE');
    }

    const legacy = await this.readLegacy(request, request.legacyChannelId);
    if (legacy === undefined) {
      return this.unavailable(request, 'LEGACY_SCHEDULE_UNAVAILABLE');
    }

    return Object.freeze({
      outcome: 'RESOLVED',
      effectiveScheduleArtifact: legacy,
      compatibilityStatus: 'CURRENT',
      schedulerMode: request.schedulerMode,
      scheduleVersion: request.scheduleVersion,
      scheduleOrigin: 'LEGACY_COMPATIBILITY',
      shadowComparison: Object.freeze({ result: 'NOT_RUN' }),
    });
  }

  private async resolveShadowCanonical<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
  ): Promise<CompatibilitySchedulingResult<TArtifact>> {
    if (request.approvedScheduleArtifact === undefined) {
      return this.unavailable(request, 'CANONICAL_ARTIFACT_UNAVAILABLE');
    }

    this.recordCounter(request, 'CANONICAL_READS', 'canonical-read', 'SUCCESS');

    const baseResult = {
      outcome: 'RESOLVED' as const,
      effectiveScheduleArtifact: request.approvedScheduleArtifact,
      compatibilityStatus: 'CURRENT' as const,
      schedulerMode: request.schedulerMode,
      scheduleVersion: request.scheduleVersion,
      scheduleOrigin: request.scheduleOrigin,
    };

    if (
      request.legacyChannelId === undefined ||
      this.legacyReader === undefined ||
      this.comparisonProjector === undefined
    ) {
      this.recordCounter(
        request,
        'SCHEDULE_SHADOW_COMPARISONS',
        'schedule-shadow-compare',
        'SKIPPED',
      );
      return Object.freeze({
        ...baseResult,
        shadowComparison: Object.freeze({ result: 'LEGACY_UNAVAILABLE' }),
      });
    }

    const legacy = await this.readLegacy(request, request.legacyChannelId);
    if (legacy === undefined) {
      this.recordCounter(
        request,
        'SCHEDULE_SHADOW_COMPARISONS',
        'schedule-shadow-compare',
        'SKIPPED',
      );
      return Object.freeze({
        ...baseResult,
        shadowComparison: Object.freeze({ result: 'LEGACY_UNAVAILABLE' }),
      });
    }

    let comparison: CompatibilityScheduleShadowComparison;
    try {
      const canonicalProjection = this.comparisonProjector.projectSchedule(
        request.approvedScheduleArtifact,
        request.comparisonHorizon,
      );
      const legacyProjection = this.comparisonProjector.projectSchedule(
        legacy,
        request.comparisonHorizon,
      );

      comparison = compareCompatibilityScheduleProjections(
        canonicalProjection,
        legacyProjection,
        request.comparisonHorizon,
        request.tolerancePolicy,
      );
    } catch {
      this.recordCounter(
        request,
        'SCHEDULE_SHADOW_COMPARISONS',
        'schedule-shadow-compare',
        'FAILURE',
      );
      return Object.freeze({
        ...baseResult,
        shadowComparison: Object.freeze({ result: 'COMPARISON_FAILED' }),
      });
    }

    this.recordCounter(
      request,
      'SCHEDULE_SHADOW_COMPARISONS',
      'schedule-shadow-compare',
      'SUCCESS',
    );

    if (comparison.result === 'DIVERGED') {
      this.recordCounter(
        request,
        'SCHEDULE_SHADOW_DIVERGENCES',
        'schedule-shadow-divergence',
        'CONFLICT',
      );
    }

    return Object.freeze({
      ...baseResult,
      shadowComparison: comparison,
    });
  }

  private resolveFrozen<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
  ): CompatibilitySchedulingResult<TArtifact> {
    if (request.approvedScheduleArtifact === undefined) {
      return this.unavailable(request, 'CANONICAL_ARTIFACT_UNAVAILABLE');
    }

    this.recordCounter(request, 'CANONICAL_READS', 'canonical-read', 'FROZEN');

    return Object.freeze({
      outcome: 'RESOLVED',
      effectiveScheduleArtifact: request.approvedScheduleArtifact,
      compatibilityStatus: 'FROZEN',
      schedulerMode: request.schedulerMode,
      scheduleVersion: request.scheduleVersion,
      scheduleOrigin: request.scheduleOrigin,
      shadowComparison: Object.freeze({ result: 'NOT_RUN' }),
    });
  }

  private async readLegacy<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
    legacyChannelId: string,
  ): Promise<TArtifact | undefined> {
    this.throwIfAborted(request.signal);

    if (this.legacyReader === undefined) {
      return undefined;
    }

    try {
      const artifact = await this.legacyReader.readLegacySchedule({
        legacyChannelId,
        evaluationTimeMs: request.evaluationTimeMs,
        comparisonHorizon: request.comparisonHorizon,
        signal: request.signal,
      });

      this.recordCounter(
        request,
        'LEGACY_SCHEDULE_READS',
        'legacy-schedule-read',
        artifact === undefined ? 'NOT_FOUND' : 'SUCCESS',
      );

      return artifact;
    } catch (error) {
      if (request.signal?.aborted === true) {
        throw error;
      }

      this.recordCounter(
        request,
        'LEGACY_SCHEDULE_READS',
        'legacy-schedule-read',
        'FAILURE',
      );
      return undefined;
    }
  }

  private unavailable<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
    failureReason: CompatibilitySchedulingUnavailableResult['failureReason'],
  ): CompatibilitySchedulingUnavailableResult {
    return Object.freeze({
      outcome: 'UNAVAILABLE',
      compatibilityStatus: 'FAILED',
      schedulerMode: request.schedulerMode,
      scheduleVersion: request.scheduleVersion,
      shadowComparison: Object.freeze({ result: 'NOT_RUN' }),
      failureReason,
    });
  }

  private recordCounter<TPlan>(
    request: CompatibilitySchedulingRequest<TArtifact, TPlan>,
    metric:
      | 'CANONICAL_READS'
      | 'LEGACY_SCHEDULE_READS'
      | 'LEGACY_SCHEDULE_FALLBACKS'
      | 'SCHEDULE_SHADOW_COMPARISONS'
      | 'SCHEDULE_SHADOW_DIVERGENCES',
    operation: string,
    result: CompatibilityMetricResult,
  ): void {
    if (this.metrics === undefined) {
      return;
    }

    const dimensions: CompatibilityMetricDimensions = {
      concept: 'scheduling',
      entityType: 'channel',
      operation,
      mode: metricMode(request),
      result,
    };

    try {
      this.metrics.increment(metric, dimensions);
    } catch {
      // Observability must never change scheduler authority or fallback behavior.
    }
  }

  private throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted === true) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new Error('Scheduling compatibility operation canceled.');
    }
  }
}
