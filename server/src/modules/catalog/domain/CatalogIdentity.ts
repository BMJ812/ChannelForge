import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type CatalogItemId = BrandedIdentifier<'CatalogItemId'>;

export const CatalogItemId =
  createUuidV4IdentifierCodec<CatalogItemId>('CatalogItemId');

export type CatalogSnapshotId = BrandedIdentifier<'CatalogSnapshotId'>;

export const CatalogSnapshotId =
  createUuidV4IdentifierCodec<CatalogSnapshotId>('CatalogSnapshotId');
