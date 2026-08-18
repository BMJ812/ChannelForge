import type {
  MediaLibraryKind,
  MediaSourceId,
  RemoteMediaSourceKind,
} from '../domain/MediaSource.js';

export type ProviderLibraryObservation = Readonly<{
  mediaSourceId: MediaSourceId;
  externalLibraryId: string;
  name: string;
  mediaKind: MediaLibraryKind;
}>;

export interface MediaSourceProviderAdapter {
  readonly sourceKind: RemoteMediaSourceKind;

  listLibraries(
    mediaSourceId: MediaSourceId,
  ): Promise<readonly ProviderLibraryObservation[]>;
}

export interface MediaSourceProviderAdapterRegistry {
  getProviderAdapter(
    sourceKind: RemoteMediaSourceKind,
  ): MediaSourceProviderAdapter;
}
