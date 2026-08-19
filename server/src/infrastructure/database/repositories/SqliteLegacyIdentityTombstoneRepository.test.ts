import { mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  LegacyIdentityTombstoneConstraintError,
  LegacyIdentityTombstoneId,
} from '@/modules/migration/index.js';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';

import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';

import { SqliteLegacyIdentityTombstoneRepository } from './SqliteLegacyIdentityTombstoneRepository.js';

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-tombstone-'));

  directories.push(directory);

  return join(directory, 'database.sqlite');
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('SqliteLegacyIdentityTombstoneRepository', () => {
  it('persists a tombstone and preserves the opaque legacy identifier across reopen', () => {
    const filename = createFilename();

    const opaqueIdentifier = ' legacy-instance ';

    const tombstoneId = LegacyIdentityTombstoneId.generate();

    const first = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        first,
        channelForgeSchemaMigrations,
      ).migrate();

      new SqliteLegacyIdentityTombstoneRepository(first).insert(
        Object.freeze({
          tombstoneId,

          legacy: Object.freeze({
            namespace: 'tunarr',

            entityType: 'instance',

            identifier: opaqueIdentifier,
          }),

          reason: 'REPLACED',

          replacement: Object.freeze({
            entityType: 'instance',

            identifier: 'canonical-instance-id',
          }),

          createdAt: '2026-08-19T06:45:00.000Z',

          metadata: Object.freeze({
            proof: '04B',
          }),
        }),
      );
    } finally {
      first.close();
    }

    const reopened = openChannelForgeSqliteConnection(filename);

    try {
      const repository = new SqliteLegacyIdentityTombstoneRepository(reopened);

      expect(
        repository.findByLegacyIdentity({
          namespace: 'tunarr',

          entityType: 'instance',

          identifier: opaqueIdentifier,
        }),
      ).toEqual({
        tombstoneId,

        legacy: {
          namespace: 'tunarr',

          entityType: 'instance',

          identifier: opaqueIdentifier,
        },

        reason: 'REPLACED',

        replacement: {
          entityType: 'instance',

          identifier: 'canonical-instance-id',
        },

        createdAt: '2026-08-19T06:45:00.000Z',

        metadata: {
          proof: '04B',
        },
      });

      expect(() =>
        repository.insert(
          Object.freeze({
            tombstoneId: LegacyIdentityTombstoneId.generate(),

            legacy: Object.freeze({
              namespace: 'tunarr',

              entityType: 'instance',

              identifier: opaqueIdentifier,
            }),

            reason: 'DELETED',

            createdAt: '2026-08-19T06:46:00.000Z',

            metadata: Object.freeze({}),
          }),
        ),
      ).toThrow(LegacyIdentityTombstoneConstraintError);
    } finally {
      reopened.close();
    }
  });
});
