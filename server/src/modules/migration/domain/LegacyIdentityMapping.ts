import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type LegacyIdentityMappingId =
  BrandedIdentifier<'LegacyIdentityMappingId'>;

export const LegacyIdentityMappingId =
  createUuidV4IdentifierCodec<LegacyIdentityMappingId>(
    'LegacyIdentityMappingId',
  );

export const LegacyIdentityMappingStatuses = [
  'PENDING',
  'MAPPED',
  'VERIFIED',
  'CONFLICT',
  'IGNORED',
  'SUPERSEDED',
  'ROLLED_BACK',
] as const;

export type LegacyIdentityMappingStatus =
  (typeof LegacyIdentityMappingStatuses)[number];

export type LegacyIdentityReference = Readonly<{
  namespace: string;
  entityType: string;
  identifier: string;
}>;

export type ChannelForgeIdentityReference = Readonly<{
  entityType: string;
  identifier: string;
}>;

export type LegacyIdentityMapping = Readonly<{
  mappingId: LegacyIdentityMappingId;
  legacy: LegacyIdentityReference;
  channelForge: ChannelForgeIdentityReference;
  cardinality: 'ONE_TO_ONE';
  status: LegacyIdentityMappingStatus;
  migrationRunId?: string;
  createdAt: string;
  verifiedAt?: string;
  conflictId?: string;
  metadata: Readonly<Record<string, unknown>>;
}>;
