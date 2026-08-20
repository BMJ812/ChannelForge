import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

import type { CompatibilityErrorCode } from './CompatibilityErrors.js';
import type { CompatibilityMode } from './CompatibilityMode.js';
import type { CompatibilityWriteStatus } from './CompatibilityWriteStatus.js';

export type CompatibilityStatusId = BrandedIdentifier<'CompatibilityStatusId'>;

export const CompatibilityStatusId =
  createUuidV4IdentifierCodec<CompatibilityStatusId>('CompatibilityStatusId');

export type CompatibilityStatusScope = Readonly<{
  conceptType: string;
  subjectKey: string;
}>;

export type CompatibilityStatusRecord = Readonly<{
  statusId: CompatibilityStatusId;
  conceptType: string;
  subjectKey: string;
  channelForgeId?: string;
  legacyNamespace?: string;
  legacyId?: string;
  mode: CompatibilityMode;
  status: CompatibilityWriteStatus;
  canonicalVersion?: string;
  legacyVersion?: string;
  lastAttemptAt: string;
  lastSuccessAt?: string;
  failureCount: number;
  lastErrorCode?: CompatibilityErrorCode;
  reconciliationJobId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}>;

export interface CompatibilityStatusRepository {
  findByScope(
    scope: CompatibilityStatusScope,
  ): CompatibilityStatusRecord | undefined;

  insert(record: CompatibilityStatusRecord): void;

  update(record: CompatibilityStatusRecord, expectedVersion: number): void;
}

export class CompatibilityStatusConstraintError extends Error {
  readonly name = 'CompatibilityStatusConstraintError';
}

export class CompatibilityStatusConcurrencyError extends Error {
  readonly name = 'CompatibilityStatusConcurrencyError';
}
