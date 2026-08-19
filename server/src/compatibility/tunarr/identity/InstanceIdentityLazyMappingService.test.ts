import Database from 'better-sqlite3';

import { describe, expect, it } from 'vitest';

import { bootstrapInstance, InstanceId } from '@/modules/instance/index.js';

import { LegacyIdentityTombstoneId } from '@/modules/migration/index.js';

import { ChannelForgeMigrationRunner } from '@/infrastructure/database/migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '@/infrastructure/database/migrations/migrations/index.js';

import { SqliteInstanceRepository } from '@/infrastructure/database/repositories/SqliteInstanceRepository.js';

import { SqliteLegacyIdentityMappingRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityMappingRepository.js';

import { SqliteLegacyIdentityTombstoneRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityTombstoneRepository.js';

import { RuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';

import { InstanceIdentityLazyMappingService } from './InstanceIdentityLazyMappingService.js';

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

    now: () => new Date('2026-08-19T08:30:00.000Z'),
  });

  return InstanceId.toString(instance.instanceId);
}

function request(
  targetIdentifier: string,
  legacyIdentifier = 'legacy-client-id',
) {
  return {
    policyId: 'JELLYFIN_LOGIN_INSTANCE_IDENTITY' as const,

    legacy: {
      namespace: 'tunarr',

      entityType: 'instance',

      identifier: legacyIdentifier,
    },

    target: {
      entityType: 'instance',

      identifier: targetIdentifier,
    },

    operation: 'jellyfin-login-device-identity',

    routeTemplate: '/jellyfin/login',

    applicationVersion: '04d-test',

    sourceSchemaVersion: String(channelForgeSchemaMigrations.length),

    correlationId: '04d-test-correlation',

    now: () => new Date('2026-08-19T08:31:00.000Z'),
  };
}

describe('InstanceIdentityLazyMappingService', () => {
  it('creates, verifies, audits, and idempotently reuses one mapping', () => {
    const database = createDatabase();

    try {
      const target = bootstrapTarget(database);

      const metrics = new RuntimeCompatibilityMetrics();

      const service = new InstanceIdentityLazyMappingService(database, metrics);

      const first = service.ensureVerifiedMapping(request(target));

      expect(first.kind).toBe('CREATED');

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

        metadata: {
          createdBy: 'compatibility-lazy-mapping',

          reason: 'JELLYFIN_LOGIN_INSTANCE_IDENTITY',

          compatibilityPhase: 'M04-04D',

          applicationVersion: '04d-test',
        },
      });

      const second = service.ensureVerifiedMapping(request(target));

      expect(second).toEqual({
        kind: 'REUSED',

        mappingId: mapping?.mappingId,
      });

      const mappingCount = database
        .prepare(
          `
                SELECT count(*) AS count
                FROM cf_legacy_identity_mapping
              `,
        )
        .get() as {
        count: number;
      };

      expect(mappingCount.count).toBe(1);

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

      const idempotency = database
        .prepare(
          `
                SELECT
                  status,
                  result_reference
                FROM cf_idempotency_record
                WHERE
                  scope =
                    'compatibility.lazy-mapping.instance-identity'
              `,
        )
        .get() as
        | {
            status: string;
            result_reference: string | null;
          }
        | undefined;

      expect(idempotency).toEqual({
        status: 'COMPLETED',

        result_reference: mapping?.mappingId,
      });

      const snapshot = metrics.snapshot();

      expect(
        snapshot.counters
          .filter((entry) => entry.metric === 'MAPPING_CREATIONS')
          .reduce((total, entry) => total + entry.value, 0),
      ).toBe(1);

      expect(
        snapshot.counters
          .filter((entry) => entry.metric === 'LAZY_MAPPINGS')
          .reduce((total, entry) => total + entry.value, 0),
      ).toBe(1);
    } finally {
      database.close();
    }
  });

  it('does nothing when policy is disabled', () => {
    const database = createDatabase();

    try {
      const target = bootstrapTarget(database);

      const metrics = new RuntimeCompatibilityMetrics();

      const service = new InstanceIdentityLazyMappingService(database, metrics);

      expect(
        service.ensureVerifiedMapping({
          ...request(target),

          policyId: 'DISABLED',
        }),
      ).toEqual({
        kind: 'DISABLED',
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

      expect(metrics.snapshot().counters).toEqual([]);
    } finally {
      database.close();
    }
  });

  it('rejects policy use outside the approved Jellyfin login context', () => {
    const database = createDatabase();

    try {
      const target = bootstrapTarget(database);

      const service = new InstanceIdentityLazyMappingService(
        database,
        new RuntimeCompatibilityMetrics(),
      );

      expect(
        service.ensureVerifiedMapping({
          ...request(target),

          operation: 'some-other-operation',
        }),
      ).toEqual({
        kind: 'UNAVAILABLE',

        reason: 'POLICY_CONTEXT_MISMATCH',
      });
    } finally {
      database.close();
    }
  });

  it('keeps a tombstoned legacy identity out of lazy mapping and records conflict evidence', () => {
    const database = createDatabase();

    try {
      const target = bootstrapTarget(database);

      new SqliteLegacyIdentityTombstoneRepository(database).insert(
        Object.freeze({
          tombstoneId: LegacyIdentityTombstoneId.generate(),

          legacy: Object.freeze({
            namespace: 'tunarr',

            entityType: 'instance',

            identifier: 'legacy-client-id',
          }),

          reason: 'REPLACED',

          createdAt: '2026-08-19T08:32:00.000Z',

          metadata: Object.freeze({
            proof: '04D',
          }),
        }),
      );

      const metrics = new RuntimeCompatibilityMetrics();

      const service = new InstanceIdentityLazyMappingService(database, metrics);

      expect(service.ensureVerifiedMapping(request(target))).toEqual({
        kind: 'CONFLICT',

        reason: 'TOMBSTONED',
      });

      const mappingCount = database
        .prepare(
          `
                SELECT count(*) AS count
                FROM cf_legacy_identity_mapping
              `,
        )
        .get() as {
        count: number;
      };

      expect(mappingCount.count).toBe(0);

      const conflictAudit = database
        .prepare(
          `
                SELECT count(*) AS count
                FROM cf_audit_record
                WHERE
                  action =
                    'compatibility.lazy-map-instance-identity'
                  AND outcome = 'FAILURE'
              `,
        )
        .get() as {
        count: number;
      };

      expect(conflictAudit.count).toBe(1);

      expect(
        metrics
          .snapshot()
          .counters.some(
            (entry) =>
              entry.metric === 'MAPPING_CONFLICTS' &&
              entry.dimensions.result === 'CONFLICT',
          ),
      ).toBe(true);
    } finally {
      database.close();
    }
  });

  it('allows only one legacy identity to claim the singleton target and audits the incompatible proposal', () => {
    const database = createDatabase();

    try {
      const target = bootstrapTarget(database);

      const service = new InstanceIdentityLazyMappingService(
        database,
        new RuntimeCompatibilityMetrics(),
      );

      expect(
        service.ensureVerifiedMapping(request(target, 'legacy-client-a')).kind,
      ).toBe('CREATED');

      const competing = service.ensureVerifiedMapping(
        request(target, 'legacy-client-b'),
      );

      expect(competing).toMatchObject({
        kind: 'CONFLICT',

        reason: 'TARGET_ALREADY_MAPPED',
      });

      const mappingCount = database
        .prepare(
          `
                SELECT count(*) AS count
                FROM cf_legacy_identity_mapping
              `,
        )
        .get() as {
        count: number;
      };

      expect(mappingCount.count).toBe(1);

      const auditRows = database
        .prepare(
          `
                SELECT outcome
                FROM cf_audit_record
                WHERE
                  action =
                    'compatibility.lazy-map-instance-identity'
                ORDER BY occurred_at
              `,
        )
        .all() as ReadonlyArray<{
        outcome: string;
      }>;

      expect(auditRows.map((row) => row.outcome)).toEqual([
        'SUCCESS',
        'FAILURE',
      ]);
    } finally {
      database.close();
    }
  });
});
