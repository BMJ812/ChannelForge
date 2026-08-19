import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type AuditRecordId = BrandedIdentifier<'AuditRecordId'>;

export const AuditRecordId =
  createUuidV4IdentifierCodec<AuditRecordId>('AuditRecordId');
