import { mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  LegacyIdentityMappingId,
  LegacyIdentityMappingService,
  LegacyIdentityTombstoneId,
  MigrationConflictId,
  type LegacyIdentityMapping,
} from '@/modules/migration/index.js';

import { openChannelForgeSqliteConnection } from '@/infrastructure/database/connection/ChannelForgeSqliteConnection.js';

import { ChannelForgeMigrationRunner } from '@/infrastructure/database/migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '@/infrastructure/database/migrations/migrations/index.js';

import { SqliteLegacyIdentityMappingRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityMappingRepository.js';

import { SqliteLegacyIdentityTombstoneRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityTombstoneRepository.js';

import { SqliteMigrationConflictRepository } from '@/infrastructure/database/repositories/SqliteMigrationConflictRepository.js';

import type {
  CompatibilityCounterMetric,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
  CompatibilityTimingMetric,
} from '../ports/index.js';

import { LegacyIdentityResolver } from './LegacyIdentityResolver.js';

type CounterCall = Readonly<{
  metric: CompatibilityCounterMetric;

  dimensions: CompatibilityMetricDimensions;

  amount: number;
}>;

type TimingCall = Readonly<{
  metric: CompatibilityTimingMetric;

  milliseconds: number;

  dimensions: CompatibilityMetricDimensions;
}>;

class RecordingCompatibilityMetrics implements CompatibilityMetrics {
  readonly counters: CounterCall[] = [];

  readonly timings: TimingCall[] = [];

  increment(
    metric: CompatibilityCounterMetric,

    dimensions: CompatibilityMetricDimensions,

    amount = 1,
  ): void {
    this.counters.push(
      Object.freeze({
        metric,
        dimensions,
        amount,
      }),
    );
  }

  setGauge(
    _metric: CompatibilityGaugeMetric,

    _value: number,

    _dimensions: CompatibilityMetricDimensions,
  ): void {}

  observeMilliseconds(
    metric: CompatibilityTimingMetric,

    milliseconds: number,

    dimensions: CompatibilityMetricDimensions,
  ): void {
    this.timings.push(
      Object.freeze({
        metric,
        milliseconds,
        dimensions,
      }),
    );
  }
}

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-resolver-'));

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

function createClock(): () => number {
  let value = 100;

  return () => {
    const current = value;

    value += 5;

    return current;
  };
}

describe('LegacyIdentityResolver', () => {
  it('resolves only a VERIFIED mapping and records bounded metrics', () => {
    const database = openChannelForgeSqliteConnection(createFilename());

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const mappingRepository = new SqliteLegacyIdentityMappingRepository(
        database,
      );

      const mappingService = new LegacyIdentityMappingService(
        mappingRepository,
      );

      const mapping = mappingService.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',

          entityType: 'instance',

          identifier: 'legacy-instance',
        },

        channelForge: {
          entityType: 'instance',

          identifier: 'canonical-instance',
        },

        now: () => new Date('2026-08-19T06:50:00.000Z'),
      });

      mappingService.verifyMapping(
        mapping.mappingId,

        () => new Date('2026-08-19T06:51:00.000Z'),
      );

      const metrics = new RecordingCompatibilityMetrics();

      const resolver = new LegacyIdentityResolver(
        mappingRepository,

        new SqliteLegacyIdentityTombstoneRepository(database),

        metrics,

        createClock(),
      );

      expect(
        resolver.resolve({
          legacy: {
            namespace: ' tunarr ',

            entityType: ' instance ',

            identifier: 'legacy-instance',
          },

          concept: 'instance-identity',

          mode: 'LEGACY_ONLY',

          applicationVersion: 'test',

          sourceSchemaVersion: '6',
        }),
      ).toEqual({
        kind: 'MAPPED',

        mappingId: mapping.mappingId,

        target: {
          entityType: 'instance',

          identifier: 'canonical-instance',
        },
      });

      expect(
        metrics.counters.map(({ metric, dimensions }) => ({
          metric,
          result: dimensions.result,
        })),
      ).toEqual([
        {
          metric: 'TOMBSTONE_LOOKUPS',

          result: 'NOT_FOUND',
        },

        {
          metric: 'MAPPING_LOOKUPS',

          result: 'SUCCESS',
        },
      ]);

      for (const call of metrics.counters) {
        expect(Object.keys(call.dimensions)).not.toContain('legacyId');

        expect(Object.keys(call.dimensions)).not.toContain('channelForgeId');
      }

      expect(metrics.timings).toHaveLength(1);

      expect(metrics.timings[0]).toMatchObject({
        metric: 'COMPATIBILITY_LATENCY',

        milliseconds: 5,
      });
    } finally {
      database.close();
    }
  });

  it('gives a tombstone precedence over a historical verified mapping', () => {
    const database = openChannelForgeSqliteConnection(createFilename());

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const mappingRepository = new SqliteLegacyIdentityMappingRepository(
        database,
      );

      const mappingService = new LegacyIdentityMappingService(
        mappingRepository,
      );

      const mapping = mappingService.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',

          entityType: 'channel',

          identifier: 'legacy-channel',
        },

        channelForge: {
          entityType: 'channel',

          identifier: 'old-canonical-channel',
        },
      });

      mappingService.verifyMapping(mapping.mappingId);

      const tombstoneId = LegacyIdentityTombstoneId.generate();

      const tombstones = new SqliteLegacyIdentityTombstoneRepository(database);

      tombstones.insert(
        Object.freeze({
          tombstoneId,

          legacy: Object.freeze({
            namespace: 'tunarr',

            entityType: 'channel',

            identifier: 'legacy-channel',
          }),

          reason: 'REPLACED',

          replacement: Object.freeze({
            entityType: 'channel',

            identifier: 'replacement-channel',
          }),

          createdAt: '2026-08-19T06:52:00.000Z',

          metadata: Object.freeze({}),
        }),
      );

      const metrics = new RecordingCompatibilityMetrics();

      const resolver = new LegacyIdentityResolver(
        mappingRepository,

        tombstones,

        metrics,
      );

      expect(
        resolver.resolve({
          legacy: {
            namespace: 'tunarr',

            entityType: 'channel',

            identifier: 'legacy-channel',
          },

          concept: 'channel-identity',

          mode: 'LEGACY_ONLY',
        }),
      ).toEqual({
        kind: 'TOMBSTONED',

        tombstoneId,

        reason: 'REPLACED',

        replacement: {
          entityType: 'channel',

          identifier: 'replacement-channel',
        },
      });

      expect(metrics.counters.map((call) => call.metric)).toEqual([
        'TOMBSTONE_LOOKUPS',
        'TOMBSTONE_HITS',
      ]);
    } finally {
      database.close();
    }
  });

  it('returns a durable conflict result without selecting an arbitrary target', () => {
    const database = openChannelForgeSqliteConnection(createFilename());

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const migrationRunId = '04b-conflict-run';

      database
        .prepare(
          `
          INSERT INTO cf_migration_run (
            migration_run_id,
            migration_type,
            status
          )
          VALUES (
            ?,
            'legacy-identity-resolver',
            'RUNNING'
          )
        `,
        )
        .run(migrationRunId);

      const conflictId = MigrationConflictId.generate();

      new SqliteMigrationConflictRepository(database).insert(
        Object.freeze({
          migrationConflictId: conflictId,

          migrationRunId,

          stepKey: 'resolve-legacy-identity',

          conflictType: 'AMBIGUOUS_IDENTITY',

          sourceReference: 'tunarr/channel/ambiguous',

          candidateTargets: Object.freeze(['channel/a', 'channel/b']),

          status: 'OPEN',

          detectedAt: '2026-08-19T06:53:00.000Z',

          evidence: Object.freeze({
            proof: '04B',
          }),
        }),
      );

      const mappingId = LegacyIdentityMappingId.generate();

      const conflictedMapping: LegacyIdentityMapping = Object.freeze({
        mappingId,

        legacy: Object.freeze({
          namespace: 'tunarr',

          entityType: 'channel',

          identifier: 'ambiguous',
        }),

        channelForge: Object.freeze({
          entityType: 'channel',

          identifier: 'candidate-a',
        }),

        cardinality: 'ONE_TO_ONE',

        status: 'CONFLICT',

        migrationRunId,

        createdAt: '2026-08-19T06:53:00.000Z',

        conflictId,

        metadata: Object.freeze({}),
      });

      const mappingRepository = new SqliteLegacyIdentityMappingRepository(
        database,
      );

      mappingRepository.insert(conflictedMapping);

      const metrics = new RecordingCompatibilityMetrics();

      const resolver = new LegacyIdentityResolver(
        mappingRepository,

        new SqliteLegacyIdentityTombstoneRepository(database),

        metrics,
      );

      expect(
        resolver.resolve({
          legacy: {
            namespace: 'tunarr',

            entityType: 'channel',

            identifier: 'ambiguous',
          },

          concept: 'channel-identity',

          mode: 'LEGACY_ONLY',
        }),
      ).toEqual({
        kind: 'CONFLICT',

        mappingId,

        conflictId,
      });

      expect(
        metrics.counters.some(
          (call) =>
            call.metric === 'MAPPING_CONFLICTS' &&
            call.dimensions.result === 'CONFLICT',
        ),
      ).toBe(true);
    } finally {
      database.close();
    }
  });

  it('returns UNMAPPED for missing or unverified mapping state', () => {
    const database = openChannelForgeSqliteConnection(createFilename());

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const mappingRepository = new SqliteLegacyIdentityMappingRepository(
        database,
      );

      const tombstones = new SqliteLegacyIdentityTombstoneRepository(database);

      const metrics = new RecordingCompatibilityMetrics();

      const resolver = new LegacyIdentityResolver(
        mappingRepository,
        tombstones,
        metrics,
      );

      expect(
        resolver.resolve({
          legacy: {
            namespace: 'tunarr',

            entityType: 'instance',

            identifier: 'missing',
          },

          concept: 'instance-identity',

          mode: 'LEGACY_ONLY',
        }),
      ).toEqual({
        kind: 'UNMAPPED',

        reason: 'NOT_FOUND',
      });

      const pending = new LegacyIdentityMappingService(
        mappingRepository,
      ).ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',

          entityType: 'instance',

          identifier: 'pending',
        },

        channelForge: {
          entityType: 'instance',

          identifier: 'canonical-pending',
        },
      });

      expect(
        resolver.resolve({
          legacy: {
            namespace: 'tunarr',

            entityType: 'instance',

            identifier: 'pending',
          },

          concept: 'instance-identity',

          mode: 'LEGACY_ONLY',
        }),
      ).toEqual({
        kind: 'UNMAPPED',

        reason: 'MAPPING_NOT_VERIFIED',

        mappingId: pending.mappingId,

        mappingStatus: 'MAPPED',
      });
    } finally {
      database.close();
    }
  });
});
