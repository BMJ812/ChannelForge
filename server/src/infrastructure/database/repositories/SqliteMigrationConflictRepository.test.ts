import { mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { InstanceId } from '@/modules/instance/index.js';

import {
  LegacyIdentityMappingConflictError,
  LegacyIdentityMappingService,
} from '@/modules/migration/index.js';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';

import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';

import { SqliteLegacyIdentityMappingRepository } from './SqliteLegacyIdentityMappingRepository.js';

import { SqliteMigrationConflictRepository } from './SqliteMigrationConflictRepository.js';

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-conflict-'));

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

describe('SqliteMigrationConflictRepository', () => {
  it('persists a mapping conflict durably across close and reopen', () => {
    const filename = createFilename();

    const migrationRunId = 'run-conflict-proof';

    const first = openChannelForgeSqliteConnection(filename);

    let conflictId: LegacyIdentityMappingConflictError['conflictId'];

    try {
      new ChannelForgeMigrationRunner(
        first,
        channelForgeSchemaMigrations,
      ).migrate();

      first
        .prepare(
          `
          INSERT INTO cf_migration_run (
            migration_run_id,
            migration_type,
            status
          )
          VALUES (
            ?,
            'legacy-identity-proof',
            'RUNNING'
          )
        `,
        )
        .run(migrationRunId);

      const mappingRepository = new SqliteLegacyIdentityMappingRepository(
        first,
      );

      const conflictRepository = new SqliteMigrationConflictRepository(first);

      const service = new LegacyIdentityMappingService(
        mappingRepository,
        conflictRepository,
      );

      service.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-instance',
        },

        channelForge: {
          entityType: 'instance',
          identifier: InstanceId.toString(InstanceId.generate()),
        },

        migrationRunId,

        now: () => new Date('2026-08-19T02:00:00.000Z'),
      });

      try {
        service.ensureOneToOneMapping({
          legacy: {
            namespace: 'tunarr',
            entityType: 'instance',
            identifier: 'legacy-instance',
          },

          channelForge: {
            entityType: 'instance',
            identifier: InstanceId.toString(InstanceId.generate()),
          },

          migrationRunId,

          now: () => new Date('2026-08-19T02:01:00.000Z'),
        });

        throw new Error('Expected identity conflict');
      } catch (error) {
        expect(error).toBeInstanceOf(LegacyIdentityMappingConflictError);

        conflictId = (error as LegacyIdentityMappingConflictError).conflictId;

        expect(conflictId).toBeDefined();
      }
    } finally {
      first.close();
    }

    const reopened = openChannelForgeSqliteConnection(filename);

    try {
      const conflicts = new SqliteMigrationConflictRepository(
        reopened,
      ).listOpenByRun(migrationRunId);

      expect(conflicts).toHaveLength(1);

      expect(conflicts[0]).toMatchObject({
        migrationConflictId: conflictId,
        migrationRunId,
        conflictType: 'LEGACY_ALREADY_MAPPED',
        status: 'OPEN',
      });
    } finally {
      reopened.close();
    }
  });

  it('preserves legacy identifiers as opaque values', () => {
    const filename = createFilename();

    const database = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const service = new LegacyIdentityMappingService(
        new SqliteLegacyIdentityMappingRepository(database),
      );

      const opaque = ' legacy-with-space ';

      const mapping = service.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: opaque,
        },

        channelForge: {
          entityType: 'instance',
          identifier: InstanceId.toString(InstanceId.generate()),
        },
      });

      expect(mapping.legacy.identifier).toBe(opaque);
    } finally {
      database.close();
    }
  });
});
