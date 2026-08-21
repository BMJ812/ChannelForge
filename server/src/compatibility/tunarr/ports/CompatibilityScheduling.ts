export const CompatibilitySchedulerModes = [
  'LEGACY_AUTHORITATIVE',
  'SHADOW_CANONICAL',
  'CANONICAL_AUTHORITATIVE',
  'FROZEN',
] as const;

export type CompatibilitySchedulerMode =
  (typeof CompatibilitySchedulerModes)[number];

export function isCompatibilitySchedulerMode(
  value: unknown,
): value is CompatibilitySchedulerMode {
  return (
    typeof value === 'string' &&
    (CompatibilitySchedulerModes as readonly string[]).includes(value)
  );
}

export const CompatibilityScheduleStatuses = [
  'CURRENT',
  'DEGRADED',
  'FAILED',
  'FROZEN',
] as const;

export type CompatibilityScheduleStatus =
  (typeof CompatibilityScheduleStatuses)[number];

export const CompatibilityScheduleEntryKinds = [
  'CONTENT',
  'FILLER',
  'REDIRECT',
] as const;

export type CompatibilityScheduleEntryKind =
  (typeof CompatibilityScheduleEntryKinds)[number];

export const CompatibilityScheduleDivergenceCodes = [
  'ORDERING',
  'START_TIME',
  'DURATION',
  'CONTENT_IDENTITY',
  'FILLER_INSERTION',
  'REDIRECT',
] as const;

export type CompatibilityScheduleDivergenceCode =
  (typeof CompatibilityScheduleDivergenceCodes)[number];

export const CompatibilityScheduleShadowComparisonResults = [
  'NOT_RUN',
  'EQUAL',
  'DIVERGED',
  'LEGACY_UNAVAILABLE',
  'COMPARISON_FAILED',
] as const;

export type CompatibilityScheduleShadowComparisonResult =
  (typeof CompatibilityScheduleShadowComparisonResults)[number];

export const CompatibilityScheduleFailureReasons = [
  'CANONICAL_ARTIFACT_UNAVAILABLE',
  'LEGACY_MAPPING_REQUIRED',
  'LEGACY_READER_UNAVAILABLE',
  'LEGACY_SCHEDULE_UNAVAILABLE',
] as const;

export type CompatibilityScheduleFailureReason =
  (typeof CompatibilityScheduleFailureReasons)[number];

export const CompatibilityScheduleDegradedReasons = [
  'CANONICAL_ARTIFACT_UNAVAILABLE',
] as const;

export type CompatibilityScheduleDegradedReason =
  (typeof CompatibilityScheduleDegradedReasons)[number];

export type CompatibilityScheduleComparisonHorizon = Readonly<{
  startTimeMs: number;
  endTimeMs: number;
}>;

export type CompatibilityScheduleTolerancePolicy = Readonly<{
  startTimeToleranceMs: number;
  durationToleranceMs: number;
}>;

export type CompatibilityScheduleComparisonEntry = Readonly<{
  contentIdentity: string;
  startTimeMs: number;
  durationMs: number;
  kind: CompatibilityScheduleEntryKind;
  redirectTargetIdentity?: string;
}>;

export type CompatibilityScheduleDivergence = Readonly<{
  codes: readonly CompatibilityScheduleDivergenceCode[];
  canonicalEntryCount: number;
  legacyEntryCount: number;
}>;

export type CompatibilityScheduleShadowComparison =
  | Readonly<{
      result: 'NOT_RUN';
    }>
  | Readonly<{
      result: 'LEGACY_UNAVAILABLE' | 'COMPARISON_FAILED';
    }>
  | Readonly<{
      result: 'EQUAL';
      comparedEntries: number;
    }>
  | Readonly<{
      result: 'DIVERGED';
      comparedEntries: number;
      divergence: CompatibilityScheduleDivergence;
    }>;

export type CompatibilityScheduleFallbackPolicy = Readonly<{
  allowLegacyFallback: boolean;
  reason?: string;
}>;

export type CompatibilitySchedulingRequest<TArtifact, TPlan> = Readonly<{
  channelForgeChannelId: string;
  legacyChannelId?: string;
  scheduleVersion: string;
  approvedSchedulePlan: TPlan;
  approvedScheduleArtifact?: TArtifact;
  scheduleOrigin: string;
  evaluationTimeMs: number;
  comparisonHorizon: CompatibilityScheduleComparisonHorizon;
  tolerancePolicy: CompatibilityScheduleTolerancePolicy;
  schedulerMode: CompatibilitySchedulerMode;
  fallbackPolicy: CompatibilityScheduleFallbackPolicy;
  signal?: AbortSignal;
}>;

export type CompatibilitySchedulingResolvedResult<TArtifact> = Readonly<{
  outcome: 'RESOLVED';
  effectiveScheduleArtifact: TArtifact;
  compatibilityStatus: Extract<
    CompatibilityScheduleStatus,
    'CURRENT' | 'DEGRADED' | 'FROZEN'
  >;
  schedulerMode: CompatibilitySchedulerMode;
  scheduleVersion: string;
  scheduleOrigin: string;
  shadowComparison: CompatibilityScheduleShadowComparison;
  degradedReason?: CompatibilityScheduleDegradedReason;
}>;

export type CompatibilitySchedulingUnavailableResult = Readonly<{
  outcome: 'UNAVAILABLE';
  compatibilityStatus: 'FAILED';
  schedulerMode: CompatibilitySchedulerMode;
  scheduleVersion: string;
  shadowComparison: CompatibilityScheduleShadowComparison;
  failureReason: CompatibilityScheduleFailureReason;
}>;

export type CompatibilitySchedulingResult<TArtifact> =
  | CompatibilitySchedulingResolvedResult<TArtifact>
  | CompatibilitySchedulingUnavailableResult;

export type CompatibilityLegacyScheduleReadRequest = Readonly<{
  legacyChannelId: string;
  evaluationTimeMs: number;
  comparisonHorizon: CompatibilityScheduleComparisonHorizon;
  signal?: AbortSignal;
}>;

export interface CompatibilityLegacyScheduleReader<TArtifact> {
  readLegacySchedule(
    request: CompatibilityLegacyScheduleReadRequest,
  ): Promise<TArtifact | undefined>;
}

export interface CompatibilityScheduleComparisonProjector<TArtifact> {
  projectSchedule(
    artifact: TArtifact,
    horizon: CompatibilityScheduleComparisonHorizon,
  ): readonly CompatibilityScheduleComparisonEntry[];
}

export type CompatibilityScheduleLegacyProjectionWriteRequest<TArtifact> =
  Readonly<{
    legacyChannelId: string;
    scheduleVersion: string;
    approvedScheduleArtifact: TArtifact;
  }>;

export interface CompatibilityScheduleLegacyProjectionWriter<TArtifact> {
  writeLegacyProjection(
    request: CompatibilityScheduleLegacyProjectionWriteRequest<TArtifact>,
  ): Promise<void>;
}

export type CompatibilitySchedulerModeTransition = Readonly<{
  transitionId: string;
  from: CompatibilitySchedulerMode;
  to: CompatibilitySchedulerMode;
  actor: string;
  reason: string;
  occurredAt: string;
}>;

export function createCompatibilitySchedulerModeTransition(
  transition: CompatibilitySchedulerModeTransition,
): CompatibilitySchedulerModeTransition {
  if (transition.from === transition.to) {
    throw new Error('Scheduler mode transition must change mode.');
  }

  for (const [field, value] of [
    ['transitionId', transition.transitionId],
    ['actor', transition.actor],
    ['reason', transition.reason],
  ] as const) {
    if (value.trim().length === 0) {
      throw new Error(`Scheduler mode transition ${field} must be non-empty.`);
    }
  }

  if (Number.isNaN(Date.parse(transition.occurredAt))) {
    throw new Error(
      'Scheduler mode transition occurredAt must be ISO-parseable.',
    );
  }

  return Object.freeze({ ...transition });
}
