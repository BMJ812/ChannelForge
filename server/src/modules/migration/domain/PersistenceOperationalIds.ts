import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type BackupId = BrandedIdentifier<'BackupId'>;

export const BackupId = createUuidV4IdentifierCodec<BackupId>('BackupId');

export type IntegrityCheckId = BrandedIdentifier<'IntegrityCheckId'>;

export const IntegrityCheckId =
  createUuidV4IdentifierCodec<IntegrityCheckId>('IntegrityCheckId');
