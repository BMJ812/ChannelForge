import type { MediaSourceId } from '@/modules/media-sources/index.js';

export type CatalogSourceReference = Readonly<{
  mediaSourceId: MediaSourceId;
  externalItemId: string;
  externalItemType: string;
  externalLibraryId?: string;
}>;

export type CatalogSourceMetadataObservation = Readonly<{
  title?: string;
  durationMs?: number;
}>;

export type CatalogSourceObservation = Readonly<{
  source: CatalogSourceReference;
  metadata: CatalogSourceMetadataObservation;
  observedAt: string;
}>;
