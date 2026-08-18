export const MediaSourceKinds = ['plex', 'jellyfin', 'emby', 'local'] as const;

export type MediaSourceKind = (typeof MediaSourceKinds)[number];

export type RemoteMediaSourceKind = Exclude<MediaSourceKind, 'local'>;

export type MediaSourceId = string;

export type MediaSourceLibraryId = string;

export const MediaLibraryKinds = [
  'movies',
  'shows',
  'tracks',
  'music_videos',
  'other_videos',
] as const;

export type MediaLibraryKind = (typeof MediaLibraryKinds)[number];
