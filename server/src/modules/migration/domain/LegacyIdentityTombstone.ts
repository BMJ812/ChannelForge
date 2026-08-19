import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

import type {
  ChannelForgeIdentityReference,
  LegacyIdentityReference,
} from './LegacyIdentityMapping.js';

export type LegacyIdentityTombstoneId =
  BrandedIdentifier<'LegacyIdentityTombstoneId'>;

export const LegacyIdentityTombstoneId =
  createUuidV4IdentifierCodec<LegacyIdentityTombstoneId>(
    'LegacyIdentityTombstoneId',
  );

export const LegacyIdentityTombstoneReasons = [
  'RETIRED',
  'MERGED',
  'INVALID',
  'OMITTED',
  'REPLACED',
  'DELETED',
] as const;

export type LegacyIdentityTombstoneReason =
  (typeof LegacyIdentityTombstoneReasons)[number];

export type LegacyIdentityTombstone = Readonly<{
  tombstoneId: LegacyIdentityTombstoneId;
  legacy: LegacyIdentityReference;
  reason: LegacyIdentityTombstoneReason;
  replacement?: ChannelForgeIdentityReference;
  migrationRunId?: string;
  conflictId?: string;
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
}>;
