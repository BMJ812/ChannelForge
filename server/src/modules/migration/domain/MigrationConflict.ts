import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type MigrationConflictId = BrandedIdentifier<'MigrationConflictId'>;

export const MigrationConflictId =
  createUuidV4IdentifierCodec<MigrationConflictId>('MigrationConflictId');

export const MigrationConflictStatuses = [
  'OPEN',
  'AUTO_RESOLVED',
  'OPERATOR_RESOLVED',
  'IGNORED',
  'SUPERSEDED',
  'ROLLED_BACK',
] as const;

export type MigrationConflictStatus =
  (typeof MigrationConflictStatuses)[number];

export type MigrationConflict = Readonly<{
  migrationConflictId: MigrationConflictId;

  migrationRunId: string;

  stepKey?: string;

  conflictType: string;

  sourceReference?: string;

  candidateTargets: readonly string[];

  status: MigrationConflictStatus;

  detectedAt: string;

  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;

  evidence: Readonly<Record<string, unknown>>;
}>;
