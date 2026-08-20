export { CompatibilityErrorCodes } from './CompatibilityErrors.js';

export type {
  CompatibilityErrorCode,
  CompatibilityErrorDescriptor,
} from './CompatibilityErrors.js';

export {
  CompatibilityModes,
  isCompatibilityMode,
} from './CompatibilityMode.js';

export type { CompatibilityMode } from './CompatibilityMode.js';

export {
  CompatibilityCounterMetrics,
  CompatibilityGaugeMetrics,
  CompatibilityMetricResults,
  CompatibilityTimingMetrics,
} from './CompatibilityMetrics.js';

export type {
  CompatibilityCounterMetric,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetricResult,
  CompatibilityMetrics,
  CompatibilityTimingMetric,
} from './CompatibilityMetrics.js';

export { isCompatibilityReadValue } from './CompatibilityReadResult.js';

export type { CompatibilityReadResult } from './CompatibilityReadResult.js';

export { CompatibilityWriteStates } from './CompatibilityWriteStatus.js';

export type {
  CompatibilityWriteState,
  CompatibilityWriteStatus,
} from './CompatibilityWriteStatus.js';

export type ChannelForgeInstanceIdentity = Readonly<{
  instanceId: string;
}>;

export interface TunarrInstanceIdentityPort {
  readInstanceIdentity(): ChannelForgeInstanceIdentity;
}

export {
  CompatibilityStatusConcurrencyError,
  CompatibilityStatusConstraintError,
  CompatibilityStatusId,
} from './CompatibilityStatusRepository.js';

export type {
  CompatibilityStatusRecord,
  CompatibilityStatusRepository,
  CompatibilityStatusScope,
} from './CompatibilityStatusRepository.js';

export {
  CompatibilityReconciliationFindingId,
  CompatibilityReconciliationFindingSeverities,
  CompatibilityReconciliationFindingStatuses,
  CompatibilityReconciliationJobId,
  CompatibilityReconciliationJobStates,
  CompatibilityReconciliationOutcomes,
  CompatibilityReconciliationReasons,
} from './CompatibilityReconciliation.js';

export type {
  CompatibilityReconciliationBatchRequest,
  CompatibilityReconciliationBatchResult,
  CompatibilityReconciliationEnqueuePort,
  CompatibilityReconciliationEnqueueResult,
  CompatibilityReconciliationFinding,
  CompatibilityReconciliationFindingDraft,
  CompatibilityReconciliationFindingSeverity,
  CompatibilityReconciliationFindingStatus,
  CompatibilityReconciliationJob,
  CompatibilityReconciliationJobState,
  CompatibilityReconciliationListJobsOptions,
  CompatibilityReconciliationOutcome,
  CompatibilityReconciliationOutcomeCounts,
  CompatibilityReconciliationReason,
  CompatibilityReconciliationRepository,
  CompatibilityReconciliationRequest,
  CompatibilityReconciliationWorkerPort,
} from './CompatibilityReconciliation.js';
