import Database from 'better-sqlite3';

import { describe, expect, it } from 'vitest';

import { bootstrapInstance, InstanceId } from '@/modules/instance/index.js';
import {
  LegacyIdentityMappingService,
  LegacyIdentityTombstoneId,
} from '@/modules/migration/index.js';
import { ChannelForgeMigrationRunner } from '@/infrastructure/database/migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '@/infrastructure/database/migrations/migrations/index.js';
import { SqliteInstanceRepository } from '@/infrastructure/database/repositories/SqliteInstanceRepository.js';
import { SqliteLegacyIdentityMappingRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityMappingRepository.js';
import { SqliteLegacyIdentityTombstoneRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityTombstoneRepository.js';

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

function createSettings(clientId: string) {
  return {
    clientId: () => clientId,
  };
}

function bootstrapCanonicalInstance(database: Database.Database) {
  return bootstrapInstance(new SqliteInstanceRepository(database), {
    schemaVersion: channelForgeSchemaMigrations.length,
    applicationVersion: '04c-test',
    displayName: '04C Instance',
    defaultTimeZone: 'UTC',
    now: () => new Date('2026-08-19T07:20:00.000Z'),
  });
}

describe('CanonicalFirstTunarrInstanceIdentityReader', () => {
  it('returns canonical Instance identity when persisted identity and VERIFIED mapping agree', () => {
    const database = createDatabase();

    try {
      const instance = bootstrapCanonicalInstance(database);
      const canonicalInstanceId = InstanceId.toString(instance.instanceId);

      const mappings = new SqliteLegacyIdentityMappingRepository(database);
      const mappingService = new LegacyIdentityMappingService(mappings);

      const mapping = mappingService.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-id',
        },
        channelForge: {
          entityType: 'instance',
          identifier: canonicalInstanceId,
        },
        now: () => new Date('2026-08-19T07:21:00.000Z'),
      });

      mappingService.verifyMapping(
        mapping.mappingId,
        () => new Date('2026-08-19T07:22:00.000Z'),
      );

      const metrics = new RuntimeCompatibilityMetrics();

      const result = new CanonicalFirstTunarrInstanceIdentityReader(
        createSettings('legacy-client-id'),
        {
          database,
          metrics,
        },
      ).read({
        operation: 'jellyfin-login-device-identity',
        routeTemplate: '/jellyfin/login',
        applicationVersion: '04c-test',
      });

      expect(result).toEqual({
        source: 'CANONICAL',
        value: {
          instanceId: canonicalInstanceId,
        },
        mappingId: mapping.mappingId,
      });

      const snapshot = metrics.snapshot();

      expect(
        snapshot.counters.some(
          (entry) =>
            entry.metric === 'CANONICAL_READS' &&
            entry.dimensions.result === 'SUCCESS' &&
            entry.value === 1,
        ),
      ).toBe(true);

      expect(
        snapshot.counters.some(
          (entry) =>
            entry.metric === 'SHADOW_COMPARISONS' &&
            entry.dimensions.result === 'SUCCESS',
        ),
      ).toBe(true);

      for (const entry of snapshot.counters) {
        expect(Object.keys(entry.dimensions)).not.toContain('legacyId');
        expect(Object.keys(entry.dimensions)).not.toContain('channelForgeId');
      }
    } finally {
      database.close();
    }
  });

  it('falls back to legacy identity when ChannelForge schema is absent', () => {
    const database = new Database(':memory:');

    try {
      const metrics = new RuntimeCompatibilityMetrics();

      const result = new CanonicalFirstTunarrInstanceIdentityReader(
        createSettings('legacy-client-id'),
        {
          database,
          metrics,
        },
      ).read({
        operation: 'jellyfin-login-device-identity',
        routeTemplate: '/jellyfin/login',
      });

      expect(result).toEqual({
        source: 'LEGACY_FALLBACK',
        value: {
          instanceId: 'legacy-client-id',
        },
        warningCodes: ['CHANNELFORGE_SCHEMA_UNAVAILABLE'],
      });

      expect(
        metrics
          .snapshot()
          .counters.some(
            (entry) =>
              entry.metric === 'LEGACY_FALLBACK_READS' &&
              entry.dimensions.result === 'FALLBACK',
          ),
      ).toBe(true);
    } finally {
      database.close();
    }
  });

  it('falls back when mapping is not VERIFIED', () => {
    const database = createDatabase();

    try {
      const instance = bootstrapCanonicalInstance(database);

      new LegacyIdentityMappingService(
        new SqliteLegacyIdentityMappingRepository(database),
      ).ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-id',
        },
        channelForge: {
          entityType: 'instance',
          identifier: InstanceId.toString(instance.instanceId),
        },
      });

      const result = new CanonicalFirstTunarrInstanceIdentityReader(
        createSettings('legacy-client-id'),
        {
          database,
          metrics: new RuntimeCompatibilityMetrics(),
        },
      ).read({
        operation: 'jellyfin-login-device-identity',
        routeTemplate: '/jellyfin/login',
      });

      expect(result).toMatchObject({
        source: 'LEGACY_FALLBACK',
        value: {
          instanceId: 'legacy-client-id',
        },
        warningCodes: ['LEGACY_MAPPING_NOT_VERIFIED'],
      });
    } finally {
      database.close();
    }
  });

  it('gives a tombstone precedence over a verified mapping and keeps legacy fallback explicit', () => {
    const database = createDatabase();

    try {
      const instance = bootstrapCanonicalInstance(database);
      const canonicalInstanceId = InstanceId.toString(instance.instanceId);

      const mappings = new SqliteLegacyIdentityMappingRepository(database);
      const mappingService = new LegacyIdentityMappingService(mappings);

      const mapping = mappingService.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-id',
        },
        channelForge: {
          entityType: 'instance',
          identifier: canonicalInstanceId,
        },
      });

      mappingService.verifyMapping(mapping.mappingId);

      new SqliteLegacyIdentityTombstoneRepository(database).insert(
        Object.freeze({
          tombstoneId: LegacyIdentityTombstoneId.generate(),
          legacy: Object.freeze({
            namespace: 'tunarr',
            entityType: 'instance',
            identifier: 'legacy-client-id',
          }),
          reason: 'REPLACED',
          replacement: Object.freeze({
            entityType: 'instance',
            identifier: InstanceId.toString(InstanceId.generate()),
          }),
          createdAt: '2026-08-19T07:23:00.000Z',
          metadata: Object.freeze({
            proof: '04C',
          }),
        }),
      );

      const result = new CanonicalFirstTunarrInstanceIdentityReader(
        createSettings('legacy-client-id'),
        {
          database,
          metrics: new RuntimeCompatibilityMetrics(),
        },
      ).read({
        operation: 'jellyfin-login-device-identity',
        routeTemplate: '/jellyfin/login',
      });

      expect(result).toMatchObject({
        source: 'LEGACY_FALLBACK',
        value: {
          instanceId: 'legacy-client-id',
        },
        warningCodes: ['LEGACY_IDENTITY_TOMBSTONED'],
      });
    } finally {
      database.close();
    }
  });

  it('falls back when the mapping target does not match the persisted canonical Instance', () => {
    const database = createDatabase();

    try {
      bootstrapCanonicalInstance(database);

      const mappingService = new LegacyIdentityMappingService(
        new SqliteLegacyIdentityMappingRepository(database),
      );

      const mapping = mappingService.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-id',
        },
        channelForge: {
          entityType: 'instance',
          identifier: InstanceId.toString(InstanceId.generate()),
        },
      });

      mappingService.verifyMapping(mapping.mappingId);

      const metrics = new RuntimeCompatibilityMetrics();

      const result = new CanonicalFirstTunarrInstanceIdentityReader(
        createSettings('legacy-client-id'),
        {
          database,
          metrics,
        },
      ).read({
        operation: 'jellyfin-login-device-identity',
        routeTemplate: '/jellyfin/login',
      });

      expect(result).toMatchObject({
        source: 'LEGACY_FALLBACK',
        value: {
          instanceId: 'legacy-client-id',
        },
        warningCodes: ['TARGET_IDENTITY_MISMATCH'],
      });

      expect(
        metrics
          .snapshot()
          .counters.some(
            (entry) =>
              entry.metric === 'SHADOW_MISMATCHES' &&
              entry.dimensions.result === 'FAILURE',
          ),
      ).toBe(true);
    } finally {
      database.close();
    }
  });
});
