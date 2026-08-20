import type { CompatibilityErrorCode } from './CompatibilityErrors.js';

export const CompatibilityReconciliationReasons = [
  'LEGACY_PROJECTION_FAILED',
  'STATUS_PERSISTENCE_FAILED',
] as const;

export type CompatibilityReconciliationReason =
  (typeof CompatibilityReconciliationReasons)[number];

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
