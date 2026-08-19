export {
  LegacyIdentityResolutionErrorReasons,
  LegacyIdentityResolver,
  LegacyIdentityUnmappedReasons,
} from './identity/index.js';

export type {
  LegacyIdentityResolution,
  LegacyIdentityResolutionErrorReason,
  LegacyIdentityUnmappedReason,
  ResolveLegacyIdentityRequest,
} from './identity/index.js';

export {
  CompatibilityCounterMetrics,
  CompatibilityErrorCodes,
  CompatibilityGaugeMetrics,
  CompatibilityMetricResults,
  CompatibilityModes,
  CompatibilityTimingMetrics,
  CompatibilityWriteStates,
  isCompatibilityMode,
  isCompatibilityReadValue,
} from './ports/index.js';

export type {
  ChannelForgeInstanceIdentity,
  CompatibilityCounterMetric,
  CompatibilityErrorCode,
  CompatibilityErrorDescriptor,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetricResult,
  CompatibilityMetrics,
  CompatibilityMode,
  CompatibilityReadResult,
  CompatibilityTimingMetric,
  CompatibilityWriteState,
  CompatibilityWriteStatus,
  TunarrInstanceIdentityPort,
} from './ports/index.js';

export { getTunarrCompatibilityUsageSnapshot } from './usage/CompatibilityUsageMetrics.js';

export type {
  TunarrCompatibilityUsageKey,
  TunarrCompatibilityUsageSnapshot,
} from './usage/CompatibilityUsageMetrics.js';
