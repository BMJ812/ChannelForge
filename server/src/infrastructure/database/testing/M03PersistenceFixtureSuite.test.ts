import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { bootstrapInstance, InstanceId } from '@/modules/instance/index.js';

import { LegacyIdentityMappingService } from '@/modules/migration/index.js';

import { ChannelForgeBackupPreflightService } from '../backup/ChannelForgeBackupPreflightService.js';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';

import { SqliteIntegrityVerifier } from '../integrity/SqliteIntegrityVerifier.js';

import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';

import { SqliteInstanceRepository } from '../repositories/SqliteInstanceRepository.js';

import { SqliteLegacyIdentityMappingRepository } from '../repositories/SqliteLegacyIdentityMappingRepository.js';

import { m03PersistenceFixtures } from './M03PersistenceFixtures.js';

const directories: string[] = [];

function createDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-m03-fixture-'));

  directories.push(directory);

  return directory;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('M03 persistence fixture suite', () => {
  it('defines sanitized, checksummed synthetic fixture manifests', () => {
    expect(m03PersistenceFixtures.map((fixture) => fixture.fixtureId)).toEqual([
      'empty-install',
      'persisted-instance',
      'verified-legacy-instance-mapping',
      'restored-verified-backup',
    ]);

    for (const fixture of m03PersistenceFixtures) {
      expect(fixture.checksum).toMatch(/^[0-9a-f]{64}$/);

      expect(fixture.sanitizationStatement).toContain('Synthetic fixture only');
    }
  });

  it('migrates an empty filesystem database deterministically and idempotently', () => {
    const directory = createDirectory();

    const filename = join(directory, 'empty.sqlite');

    const database = openChannelForgeSqliteConnection(filename);

    try {
      const runner = new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
        {
          applicationVersion: 'fixture-test',
          baselineCommit: 'fixture',
        },
      );

      const first = runner.migrate();

      expect(first.applied).toEqual(
        channelForgeSchemaMigrations.map((migration) => migration.id),
      );

      const second = runner.migrate();

      expect(second.applied).toEqual([]);

      expect(second.alreadyApplied).toEqual(
        channelForgeSchemaMigrations.map((migration) => migration.id),
      );

      expect(
        runner
          .listMigrations()
          .every((migration) => migration.status === 'APPLIED'),
      ).toBe(true);

      expect(new SqliteIntegrityVerifier(database).runQuickCheck().status).toBe(
        'PASSED',
      );
    } finally {
      database.close();
    }
  });

  it('restores a verified backup with persisted Instance identity and verified legacy mapping intact', async () => {
    const currentSchemaVersion = channelForgeSchemaMigrations.length;

    const directory = createDirectory();

    const sourceFilename = join(directory, 'source.sqlite');

    const source = openChannelForgeSqliteConnection(sourceFilename);

    let canonicalInstanceId: string;

    try {
      new ChannelForgeMigrationRunner(
        source,
        channelForgeSchemaMigrations,
      ).migrate();

      const instanceRepository = new SqliteInstanceRepository(source);

      const instance = bootstrapInstance(instanceRepository, {
        schemaVersion: currentSchemaVersion,
        applicationVersion: 'fixture-test',
        displayName: 'Fixture Instance',
        defaultTimeZone: 'UTC',
        now: () => new Date('2026-08-19T01:20:00.000Z'),
      });

      canonicalInstanceId = InstanceId.toString(instance.instanceId);

      const mappingService = new LegacyIdentityMappingService(
        new SqliteLegacyIdentityMappingRepository(source),
      );

      const mapping = mappingService.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'synthetic-legacy-instance',
        },

        channelForge: {
          entityType: 'instance',
          identifier: canonicalInstanceId,
        },

        metadata: {
          fixture: 'verified-legacy-instance-mapping',
        },

        now: () => new Date('2026-08-19T01:21:00.000Z'),
      });

      mappingService.verifyMapping(
        mapping.mappingId,
        () => new Date('2026-08-19T01:22:00.000Z'),
      );

      const backup = await new ChannelForgeBackupPreflightService(
        source,
      ).createVerifiedBackup({
        backupDirectory: join(directory, 'backups'),

        applicationVersion: 'fixture-test',

        schemaVersion: currentSchemaVersion,

        createdBy: 'fixture-suite',

        now: () => new Date('2026-08-19T01:23:00.000Z'),
      });

      expect(backup.verificationStatus).toBe('VERIFIED');

      const restoreFilename = join(directory, 'restored.sqlite');

      copyFileSync(backup.backupPath, restoreFilename);

      const restored = openChannelForgeSqliteConnection(restoreFilename);

      try {
        new ChannelForgeMigrationRunner(
          restored,
          channelForgeSchemaMigrations,
        ).migrate();

        const restoredInstance = new SqliteInstanceRepository(restored).get();

        expect(restoredInstance).toBeDefined();

        expect(InstanceId.toString(restoredInstance!.instanceId)).toBe(
          canonicalInstanceId,
        );

        const restoredMapping = new SqliteLegacyIdentityMappingRepository(
          restored,
        ).findByLegacyIdentity({
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'synthetic-legacy-instance',
        });

        expect(restoredMapping?.status).toBe('VERIFIED');

        expect(restoredMapping?.channelForge.identifier).toBe(
          canonicalInstanceId,
        );

        expect(
          new SqliteIntegrityVerifier(restored).runQuickCheck().status,
        ).toBe('PASSED');
      } finally {
        restored.close();
      }
    } finally {
      source.close();
    }
  });
});
