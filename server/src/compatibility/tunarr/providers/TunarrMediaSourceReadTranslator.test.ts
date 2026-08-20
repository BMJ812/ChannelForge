import type { MediaSourceId } from '@/modules/media-sources/index.js';
import { describe, expect, it } from 'vitest';

import {
  translateTunarrMediaSourceRead,
  TunarrMediaSourceReadTranslationError,
  type TunarrRemoteMediaSourceReadRecord,
} from './TunarrMediaSourceReadTranslator.js';

const canonicalMediaSourceId =
  'd8f77d45-5c24-4eef-a75e-290cad871864' as MediaSourceId;

function source(
  overrides: Partial<TunarrRemoteMediaSourceReadRecord> = {},
): TunarrRemoteMediaSourceReadRecord {
  return {
    uuid: 'legacy-source-1',
    type: 'plex',
    name: 'Living Room Plex',
    uri: ' http://plex.internal:32400 ',
    clientIdentifier: ' client-1 ',
    username: ' brad ',
    userId: ' user-1 ',
    sendChannelUpdates: true,
    sendGuideUpdates: false,
    ...overrides,
  };
}

describe('TunarrMediaSourceReadTranslator', () => {
  it.each(['plex', 'jellyfin', 'emby'] as const)(
    'translates %s provider configuration without changing canonical identity',
    (kind) => {
      const result = translateTunarrMediaSourceRead({
        canonicalMediaSourceId,
        legacySource: source({ type: kind }),
      });

      expect(result.id).toBe(canonicalMediaSourceId);
      expect(result.kind).toBe(kind);
      expect(result.name).toBe('Living Room Plex');
      expect(result.providerConfiguration).toEqual({
        uri: 'http://plex.internal:32400',
        clientIdentifier: 'client-1',
        username: 'brad',
        userId: 'user-1',
        sendChannelUpdates: true,
        sendGuideUpdates: false,
      });
      expect(result.credentialReference).toEqual({
        key: 'tunarr-media-source:legacy-source-1:access-token',
      });
    },
  );

  it('translates selected libraries and path replacement configuration', () => {
    const result = translateTunarrMediaSourceRead({
      canonicalMediaSourceId,
      legacySource: source(),
      libraries: [
        {
          mediaSourceId: 'legacy-source-1',
          externalKey: 'library-22',
          name: 'Movies',
          mediaType: 'movies',
          enabled: true,
        },
        {
          mediaSourceId: 'legacy-source-1',
          externalKey: 'library-31',
          name: 'Shows',
          mediaType: 'shows',
          enabled: false,
        },
      ],
      pathReplacements: [
        {
          mediaSourceId: 'legacy-source-1',
          serverPath: '/provider/media',
          localPath: '/mnt/media',
        },
      ],
    });

    expect(result.libraries).toEqual([
      {
        externalLibraryId: 'library-22',
        name: 'Movies',
        mediaKind: 'movies',
        enabled: true,
      },
      {
        externalLibraryId: 'library-31',
        name: 'Shows',
        mediaKind: 'shows',
        enabled: false,
      },
    ]);

    expect(result.pathReplacements).toEqual([
      {
        serverPath: '/provider/media',
        localPath: '/mnt/media',
      },
    ]);
  });

  it('never copies the inherited plaintext access token into the read model', () => {
    const plaintext = 'SUPER-SECRET-PLEX-TOKEN';

    const legacySourceWithSecret = {
      ...source(),
      accessToken: plaintext,
    };

    const result = translateTunarrMediaSourceRead({
      canonicalMediaSourceId,
      legacySource: legacySourceWithSecret,
    });

    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain(plaintext);
    expect(serialized).not.toContain('accessToken');
    expect(result.credentialReference.key).not.toContain(plaintext);
  });

  it('uses a deterministic credential reference based on legacy identity', () => {
    const first = translateTunarrMediaSourceRead({
      canonicalMediaSourceId,
      legacySource: source(),
    });

    const second = translateTunarrMediaSourceRead({
      canonicalMediaSourceId,
      legacySource: source(),
    });

    expect(first.credentialReference).toEqual(second.credentialReference);
  });

  it('omits blank optional provider fields', () => {
    const result = translateTunarrMediaSourceRead({
      canonicalMediaSourceId,
      legacySource: source({
        clientIdentifier: ' ',
        username: null,
        userId: '',
      }),
    });

    expect(result.providerConfiguration).toEqual({
      uri: 'http://plex.internal:32400',
      sendChannelUpdates: true,
      sendGuideUpdates: false,
    });
  });

  it('rejects local sources at runtime', () => {
    const localSource = {
      ...source(),
      type: 'local',
    } as unknown as TunarrRemoteMediaSourceReadRecord;

    expect(() =>
      translateTunarrMediaSourceRead({
        canonicalMediaSourceId,
        legacySource: localSource,
      }),
    ).toThrowError(
      new TunarrMediaSourceReadTranslationError('UNSUPPORTED_SOURCE_KIND'),
    );
  });

  it('rejects blank required source fields without serializing source data', () => {
    expect(() =>
      translateTunarrMediaSourceRead({
        canonicalMediaSourceId,
        legacySource: source({
          uri: ' ',
        }),
      }),
    ).toThrowError(
      new TunarrMediaSourceReadTranslationError('INVALID_SOURCE_URI'),
    );
  });

  it('rejects a library from another legacy Media Source', () => {
    expect(() =>
      translateTunarrMediaSourceRead({
        canonicalMediaSourceId,
        legacySource: source(),
        libraries: [
          {
            mediaSourceId: 'other-source',
            externalKey: 'library-22',
            name: 'Movies',
            mediaType: 'movies',
            enabled: true,
          },
        ],
      }),
    ).toThrowError(
      new TunarrMediaSourceReadTranslationError('FOREIGN_LIBRARY'),
    );
  });

  it('rejects a path replacement from another legacy Media Source', () => {
    expect(() =>
      translateTunarrMediaSourceRead({
        canonicalMediaSourceId,
        legacySource: source(),
        pathReplacements: [
          {
            mediaSourceId: 'other-source',
            serverPath: '/provider/media',
            localPath: '/mnt/media',
          },
        ],
      }),
    ).toThrowError(
      new TunarrMediaSourceReadTranslationError('FOREIGN_PATH_REPLACEMENT'),
    );
  });

  it('returns frozen read-side projections', () => {
    const result = translateTunarrMediaSourceRead({
      canonicalMediaSourceId,
      legacySource: source(),
      libraries: [
        {
          mediaSourceId: 'legacy-source-1',
          externalKey: 'library-22',
          name: 'Movies',
          mediaType: 'movies',
          enabled: true,
        },
      ],
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.providerConfiguration)).toBe(true);
    expect(Object.isFrozen(result.credentialReference)).toBe(true);
    expect(Object.isFrozen(result.libraries)).toBe(true);
    expect(Object.isFrozen(result.libraries[0])).toBe(true);
    expect(Object.isFrozen(result.pathReplacements)).toBe(true);
  });
});
