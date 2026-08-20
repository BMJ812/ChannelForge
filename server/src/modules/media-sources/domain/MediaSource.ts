import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export const MediaSourceKinds = ['plex', 'jellyfin', 'emby', 'local'] as const;

export type MediaSourceKind = (typeof MediaSourceKinds)[number];

export type RemoteMediaSourceKind = Exclude<MediaSourceKind, 'local'>;

export type MediaSourceId = BrandedIdentifier<'MediaSourceId'>;

export const MediaSourceId =
  createUuidV4IdentifierCodec<MediaSourceId>('MediaSourceId');

export type MediaSourceLibraryId = BrandedIdentifier<'MediaSourceLibraryId'>;

export const MediaSourceLibraryId =
  createUuidV4IdentifierCodec<MediaSourceLibraryId>('MediaSourceLibraryId');

export const MediaLibraryKinds = [
  'movies',
  'shows',
  'tracks',
  'music_videos',
  'other_videos',
] as const;

export type MediaLibraryKind = (typeof MediaLibraryKinds)[number];

export type MediaSourceCredentialReference = Readonly<{
  key: string;
}>;

export function createMediaSourceCredentialReference(
  key: string,
): MediaSourceCredentialReference {
  const normalized = key.trim();

  if (normalized.length === 0) {
    throw new Error('Media Source credential reference key is required');
  }

  return Object.freeze({
    key: normalized,
  });
}

export type RemoteMediaSourceProviderConfiguration = Readonly<{
  uri: string;
  clientIdentifier?: string;
  username?: string;
  userId?: string;
  sendChannelUpdates: boolean;
  sendGuideUpdates: boolean;
}>;

export type MediaSourceLibraryBindingReadModel = Readonly<{
  externalLibraryId: string;
  name: string;
  mediaKind: MediaLibraryKind;
  enabled: boolean;
}>;

export type MediaSourcePathReplacementReadModel = Readonly<{
  serverPath: string;
  localPath: string;
}>;

export type RemoteMediaSourceReadModel = Readonly<{
  id: MediaSourceId;
  kind: RemoteMediaSourceKind;
  name: string;
  providerConfiguration: RemoteMediaSourceProviderConfiguration;
  credentialReference: MediaSourceCredentialReference;
  libraries: readonly MediaSourceLibraryBindingReadModel[];
  pathReplacements: readonly MediaSourcePathReplacementReadModel[];
}>;
