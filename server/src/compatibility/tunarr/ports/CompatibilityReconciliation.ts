import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

import type { CompatibilityErrorCode } from './CompatibilityErrors.js';

export const CompatibilityReconciliationReasons = [
  'LEGACY_PROJECTION_FAILED',
  'STATUS_PERSISTENCE_FAILED',
  'STARTUP_RECOVERY',
  'PERIODIC',
  'PRE_CUTOVER',
  'OPERATOR_REQUEST',
  'PRE_FREEZE',
  'RELEASE_VALIDATION',
] as const;

export type CompatibilityReconciliationReason =
  (typeof CompatibilityReconciliationReasons)[number];

export const CompatibilityReconciliationJobStates = [
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELED',
] as const;

export type CompatibilityReconciliationJobState =
  (typeof CompatibilityReconciliationJobStates)[number];

export const CompatibilityReconciliationFindingSeverities = [
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL',
] as const;

export type CompatibilityReconciliationFindingSeverity =
  (typeof CompatibilityReconciliationFindingSeverities)[number];

export const CompatibilityReconciliationFindingStatuses = [
  'OPEN',
  'RESOLVED',
] as const;

export type CompatibilityReconciliationFindingStatus =
  (typeof CompatibilityReconciliationFindingStatuses)[number];

export const CompatibilityReconciliationOutcomes = [
  'EQUAL',
  'LEGACY_REPAIRED',
  'CANONICAL_REPAIR_REQUIRED',
  'CONFLICT',
  'UNSUPPORTED',
  'RETRY',
  'OPERATOR_ACTION',
] as const;

export type CompatibilityReconciliationOutcome =
  (typeof CompatibilityReconciliationOutcomes)[number];

export type CompatibilityReconciliationJobId =
  BrandedIdentifier<'CompatibilityReconciliationJobId'>;

export const CompatibilityReconciliationJobId =
  createUuidV4IdentifierCodec<CompatibilityReconciliationJobId>(
    'CompatibilityReconciliationJobId',
  );

export type CompatibilityReconciliationFindingId =
  BrandedIdentifier<'CompatibilityReconciliationFindingId'>;

export const CompatibilityReconciliationFindingId =
  createUuidV4IdentifierCodec<CompatibilityReconciliationFindingId>(
    'CompatibilityReconciliationFindingId',
  );

export type CompatibilityReconciliationRequest = Readonly<{
  conceptType: string;
  subjectKey: string;
  reason: CompatibilityReconciliationReason;
  canonicalVersion?: string;
  legacyVersion?: string;
  errorCode?: CompatibilityErrorCode;
  routeTemplate?: string;
  operation: string;
  correlationId?: string;
}>;

export type CompatibilityReconciliationEnqueueResult = Readonly<{
  jobId: string;
  queueDepth?: number;
}>;

export interface CompatibilityReconciliationEnqueuePort {
  enqueue(
    request: CompatibilityReconciliationRequest,
  ): Promise<CompatibilityReconciliationEnqueueResult>;
}

export type CompatibilityReconciliationJob = Readonly<{
  jobId: CompatibilityReconciliationJobId;
  conceptType: string;
  subjectKey: string;
  reason: CompatibilityReconciliationReason;
  canonicalVersion?: string;
  legacyVersion?: string;
  errorCode?: CompatibilityErrorCode;
  routeTemplate?: string;
  operation: string;
  correlationId?: string;
  state: CompatibilityReconciliationJobState;
  checkpoint?: string;
  attemptCount: number;
  processedCount: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  lastErrorCode?: CompatibilityErrorCode;
}>;

export type CompatibilityReconciliationFindingDraft = Readonly<{
  findingKey: string;
  channelForgeId?: string;
  legacyNamespace?: string;
  legacyId?: string;
  differenceCode: string;
  severity: CompatibilityReconciliationFindingSeverity;
  outcome: CompatibilityReconciliationOutcome;
  repairAction?: string;
  status: CompatibilityReconciliationFindingStatus;
}>;

export type CompatibilityReconciliationFinding = Readonly<{
  findingId: CompatibilityReconciliationFindingId;
  jobId: CompatibilityReconciliationJobId;
  findingKey: string;
  conceptType: string;
  subjectKey: string;
  channelForgeId?: string;
  legacyNamespace?: string;
  legacyId?: string;
  differenceCode: string;
  severity: CompatibilityReconciliationFindingSeverity;
  outcome: CompatibilityReconciliationOutcome;
  repairAction?: string;
  attemptCount: number;
  status: CompatibilityReconciliationFindingStatus;
  firstObservedAt: string;
  lastObservedAt: string;
  resolvedAt?: string;
}>;

export type CompatibilityReconciliationListJobsOptions = Readonly<{
  state?: CompatibilityReconciliationJobState;
  limit?: number;
}>;

export type CompatibilityReconciliationOutcomeCounts = Readonly<
  Partial<Record<CompatibilityReconciliationOutcome, number>>
>;

export type CompatibilityReconciliationBatchRequest = Readonly<{
  job: CompatibilityReconciliationJob;
  batchSize: number;
}>;

export type CompatibilityReconciliationBatchResult = Readonly<{
  compared: number;
  complete: boolean;
  checkpoint?: string;
  outcomeCounts: CompatibilityReconciliationOutcomeCounts;
  findings: readonly CompatibilityReconciliationFindingDraft[];
}>;

export interface CompatibilityReconciliationWorkerPort {
  reconcileBatch(
    request: CompatibilityReconciliationBatchRequest,
  ): Promise<CompatibilityReconciliationBatchResult>;
}

export interface CompatibilityReconciliationRepository
  extends CompatibilityReconciliationEnqueuePort {
  recoverInterrupted(at: string): number;

  claimNext(at: string): CompatibilityReconciliationJob | undefined;

  checkpoint(
    jobId: CompatibilityReconciliationJobId,
    checkpoint: string | undefined,
    processedDelta: number,
    at: string,
  ): void;

  complete(
    jobId: CompatibilityReconciliationJobId,
    processedDelta: number,
    at: string,
  ): void;

  retry(
    jobId: CompatibilityReconciliationJobId,
    checkpoint: string | undefined,
    processedDelta: number,
    errorCode: CompatibilityErrorCode,
    at: string,
  ): void;

  fail(
    jobId: CompatibilityReconciliationJobId,
    errorCode: CompatibilityErrorCode,
    at: string,
  ): void;

  cancel(jobId: CompatibilityReconciliationJobId, at: string): void;

  upsertFinding(
    jobId: CompatibilityReconciliationJobId,
    finding: CompatibilityReconciliationFindingDraft,
    at: string,
  ): CompatibilityReconciliationFinding;

  getJob(
    jobId: CompatibilityReconciliationJobId,
  ): CompatibilityReconciliationJob | undefined;

  listJobs(
    options?: CompatibilityReconciliationListJobsOptions,
  ): readonly CompatibilityReconciliationJob[];

  listOpenFindings(
    limit?: number,
  ): readonly CompatibilityReconciliationFinding[];

  countQueued(): number;

  oldestOpenFindingAt(): string | undefined;
}
