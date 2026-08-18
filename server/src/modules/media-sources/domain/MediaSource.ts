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
