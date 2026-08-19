import Database from 'better-sqlite3';

import { describe, expect, it } from 'vitest';

import { bootstrapInstance, InstanceId } from '@/modules/instance/index.js';

import { ChannelForgeMigrationRunner } from '@/infrastructure/database/migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '@/infrastructure/database/migrations/migrations/index.js';

import { SqliteInstanceRepository } from '@/infrastructure/database/repositories/SqliteInstanceRepository.js';

import { SqliteLegacyIdentityMappingRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityMappingRepository.js';

import { RuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';

import { CanonicalFirstTunarrInstanceIdentityReader } from './CanonicalFirstTunarrInstanceIdentityReader.js';

function createDatabase(): Database.Database {
  const database = new Database(':memory:');

  database.pragma('foreign_keys = ON');

  new ChannelForgeMigrationRunner(
    database,
    channelForgeSchemaMigrations,
  ).migrate();

  return database;
}

function bootstrapTarget(database: Database.Database): string {
  const instance = bootstrapInstance(new SqliteInstanceRepository(database), {
    schemaVersion: channelForgeSchemaMigrations.length,

    applicationVersion: '04d-test',

    displayName: '04D Instance',

    defaultTimeZone: 'UTC',
  });

  return InstanceId.toString(instance.instanceId);
}

describe('CanonicalFirstTunarrInstanceIdentityReader lazy mapping', () => {
  it('creates a verified mapping under the approved policy and returns canonical identity on the same read', () => {
    const database = createDatabase();

    try {
      const target = bootstrapTarget(database);

      const metrics = new RuntimeCompatibilityMetrics();

      const reader = new CanonicalFirstTunarrInstanceIdentityReader(
        {
          clientId: () => 'legacy-client-id',
        },
        {
          database,
          metrics,
        },
      );

      expect(
        reader.read({
          operation: 'jellyfin-login-device-identity',

          routeTemplate: '/jellyfin/login',

          applicationVersion: '04d-test',

          correlationId: 'request-04d',

          lazyMappingPolicy: 'JELLYFIN_LOGIN_INSTANCE_IDENTITY',
        }),
      ).toMatchObject({
        source: 'CANONICAL',

        value: {
          instanceId: target,
        },
      });

      const mapping = new SqliteLegacyIdentityMappingRepository(
        database,
      ).findByLegacyIdentity({
        namespace: 'tunarr',

        entityType: 'instance',

        identifier: 'legacy-client-id',
      });

      expect(mapping).toMatchObject({
        status: 'VERIFIED',

        channelForge: {
          entityType: 'instance',

          identifier: target,
        },
      });

      expect(
        reader.read({
          operation: 'jellyfin-login-device-identity',

          routeTemplate: '/jellyfin/login',

          applicationVersion: '04d-test',

          correlationId: 'request-04d-second',

          lazyMappingPolicy: 'JELLYFIN_LOGIN_INSTANCE_IDENTITY',
        }),
      ).toMatchObject({
        source: 'CANONICAL',

        value: {
          instanceId: target,
        },

        mappingId: mapping?.mappingId,
      });

      const auditCount = database
        .prepare(
          `
                SELECT count(*) AS count
                FROM cf_audit_record
                WHERE
                  action =
                    'compatibility.lazy-map-instance-identity'
                  AND outcome = 'SUCCESS'
              `,
        )
        .get() as {
        count: number;
      };

      expect(auditCount.count).toBe(1);

      expect(
        metrics
          .snapshot()
          .counters.some(
            (entry) => entry.metric === 'LAZY_MAPPINGS' && entry.value === 1,
          ),
      ).toBe(true);
    } finally {
      database.close();
    }
  });

  it('keeps missing mapping as legacy fallback when no lazy mapping policy is supplied', () => {
    const database = createDatabase();

    try {
      bootstrapTarget(database);

      const reader = new CanonicalFirstTunarrInstanceIdentityReader(
        {
          clientId: () => 'legacy-client-id',
        },
        {
          database,

          metrics: new RuntimeCompatibilityMetrics(),
        },
      );

      expect(
        reader.read({
          operation: 'jellyfin-login-device-identity',

          routeTemplate: '/jellyfin/login',

          applicationVersion: '04d-test',
        }),
      ).toEqual({
        source: 'LEGACY_FALLBACK',

        value: {
          instanceId: 'legacy-client-id',
        },

        warningCodes: ['LEGACY_MAPPING_NOT_FOUND'],
      });

      const count = database
        .prepare(
          `
                SELECT count(*) AS count
                FROM cf_legacy_identity_mapping
              `,
        )
        .get() as {
        count: number;
      };

      expect(count.count).toBe(0);
    } finally {
      database.close();
    }
  });
});
