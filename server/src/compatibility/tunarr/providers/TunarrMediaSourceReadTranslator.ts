import type { MediaSourceOrm as LegacyMediaSource } from '@/db/schema/MediaSource.js';
import type { MediaSourceLibrary as LegacyMediaSourceLibrary } from '@/db/schema/MediaSourceLibrary.js';
import type { MediaSourceLibraryReplacePath as LegacyMediaSourceLibraryReplacePath } from '@/db/schema/MediaSourceLibraryReplacePath.js';
import {
  createMediaSourceCredentialReference,
  type MediaSourceId,
  type MediaSourceLibraryBindingReadModel,
  type MediaSourcePathReplacementReadModel,
  type RemoteMediaSourceKind,
  type RemoteMediaSourceProviderConfiguration,
  type RemoteMediaSourceReadModel,
} from '@/modules/media-sources/index.js';

export const TunarrMediaSourceReadTranslationErrorReasons = [
  'UNSUPPORTED_SOURCE_KIND',
  'INVALID_SOURCE_NAME',
  'INVALID_SOURCE_URI',
  'FOREIGN_LIBRARY',
  'FOREIGN_PATH_REPLACEMENT',
] as const;

export type TunarrMediaSourceReadTranslationErrorReason =
  (typeof TunarrMediaSourceReadTranslationErrorReasons)[number];

export class TunarrMediaSourceReadTranslationError extends Error {
  constructor(readonly reason: TunarrMediaSourceReadTranslationErrorReason) {
    super(`Tunarr Media Source read translation failed: ${reason}`);
    this.name = 'TunarrMediaSourceReadTranslationError';
  }
}

export type TunarrRemoteMediaSourceReadRecord = Readonly<
  Omit<
    Pick<
      LegacyMediaSource,
      | 'uuid'
      | 'type'
      | 'name'
      | 'uri'
      | 'clientIdentifier'
      | 'username'
      | 'userId'
      | 'sendChannelUpdates'
      | 'sendGuideUpdates'
    >,
    'type'
  > & {
    type: RemoteMediaSourceKind;
  }
>;

export type TunarrMediaSourceLibraryReadRecord = Readonly<
  Pick<
    LegacyMediaSourceLibrary,
    'mediaSourceId' | 'externalKey' | 'name' | 'mediaType' | 'enabled'
  >
>;

export type TunarrMediaSourcePathReplacementReadRecord = Readonly<
  Pick<
    LegacyMediaSourceLibraryReplacePath,
    'mediaSourceId' | 'serverPath' | 'localPath'
  >
>;

export type TranslateTunarrMediaSourceReadRequest = Readonly<{
  canonicalMediaSourceId: MediaSourceId;
  legacySource: TunarrRemoteMediaSourceReadRecord;
  libraries?: readonly TunarrMediaSourceLibraryReadRecord[];
  pathReplacements?: readonly TunarrMediaSourcePathReplacementReadRecord[];
}>;

const RemoteKinds = new Set<RemoteMediaSourceKind>([
  'plex',
  'jellyfin',
  'emby',
]);

function optionalText(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? undefined : normalized;
}

function requiredText(
  value: string,
  reason: Extract<
    TunarrMediaSourceReadTranslationErrorReason,
    'INVALID_SOURCE_NAME' | 'INVALID_SOURCE_URI'
  >,
): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new TunarrMediaSourceReadTranslationError(reason);
  }

  return normalized;
}

function credentialReferenceFor(legacyMediaSourceId: string) {
  return createMediaSourceCredentialReference(
    `tunarr-media-source:${legacyMediaSourceId}:access-token`,
  );
}

function translateProviderConfiguration(
  source: TunarrRemoteMediaSourceReadRecord,
): RemoteMediaSourceProviderConfiguration {
  const clientIdentifier = optionalText(source.clientIdentifier);
  const username = optionalText(source.username);
  const userId = optionalText(source.userId);

  return Object.freeze({
    uri: requiredText(source.uri, 'INVALID_SOURCE_URI'),
    ...(clientIdentifier === undefined ? {} : { clientIdentifier }),
    ...(username === undefined ? {} : { username }),
    ...(userId === undefined ? {} : { userId }),
    sendChannelUpdates: source.sendChannelUpdates === true,
    sendGuideUpdates: source.sendGuideUpdates === true,
  });
}

function translateLibraries(
  source: TunarrRemoteMediaSourceReadRecord,
  libraries: readonly TunarrMediaSourceLibraryReadRecord[],
): readonly MediaSourceLibraryBindingReadModel[] {
  return Object.freeze(
    libraries.map((library) => {
      if (library.mediaSourceId !== source.uuid) {
        throw new TunarrMediaSourceReadTranslationError('FOREIGN_LIBRARY');
      }

      return Object.freeze({
        externalLibraryId: library.externalKey,
        name: library.name,
        mediaKind: library.mediaType,
        enabled: library.enabled,
      });
    }),
  );
}

function translatePathReplacements(
  source: TunarrRemoteMediaSourceReadRecord,
  replacements: readonly TunarrMediaSourcePathReplacementReadRecord[],
): readonly MediaSourcePathReplacementReadModel[] {
  return Object.freeze(
    replacements.map((replacement) => {
      if (replacement.mediaSourceId !== source.uuid) {
        throw new TunarrMediaSourceReadTranslationError(
          'FOREIGN_PATH_REPLACEMENT',
        );
      }

      return Object.freeze({
        serverPath: replacement.serverPath,
        localPath: replacement.localPath,
      });
    }),
  );
}

export function translateTunarrMediaSourceRead(
  request: TranslateTunarrMediaSourceReadRequest,
): RemoteMediaSourceReadModel {
  const source = request.legacySource;

  if (!RemoteKinds.has(source.type)) {
    throw new TunarrMediaSourceReadTranslationError('UNSUPPORTED_SOURCE_KIND');
  }

  return Object.freeze({
    id: request.canonicalMediaSourceId,
    kind: source.type,
    name: requiredText(source.name, 'INVALID_SOURCE_NAME'),
    providerConfiguration: translateProviderConfiguration(source),
    credentialReference: credentialReferenceFor(source.uuid),
    libraries: translateLibraries(source, request.libraries ?? []),
    pathReplacements: translatePathReplacements(
      source,
      request.pathReplacements ?? [],
    ),
  });
}
