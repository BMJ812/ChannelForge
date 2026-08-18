import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  bootstrapInstance,
  InstanceAlreadyExistsError,
  InstanceId,
  StaleInstanceVersionError,
  type PersistedInstance,
} from '@/modules/instance/index.js';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import { SqliteTransactionCoordinator } from '../transactions/SqliteTransactionCoordinator.js';
import { SqliteInstanceRepository } from './SqliteInstanceRepository.js';

const directories: string[] = [];

function createDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-instance-'));

  directories.push(directory);

  return join(directory, 'channelforge.sqlite');
}

function migrate(filename: string) {
  const database = openChannelForgeSqliteConnection(filename);

  new ChannelForgeMigrationRunner(
    database,
    channelForgeSchemaMigrations,
  ).migrate();

  return database;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('SqliteInstanceRepository', () => {
  it('persists one ChannelForge Instance across database reopen', () => {
    const filename = createDatabasePath();

    const firstDatabase = migrate(filename);

    let created: PersistedInstance;

    try {
      const repository = new SqliteInstanceRepository(firstDatabase);

      created = bootstrapInstance(repository, {
        schemaVersion: 2,
        applicationVersion: 'test-version',
        now: () => new Date('2026-08-18T09:30:00.000Z'),
      });

      expect(InstanceId.parse(created.instanceId)).toBe(created.instanceId);

      expect(repository.get()).toEqual(created);
    } finally {
      firstDatabase.close();
    }

    const reopened = migrate(filename);

    try {
      const repository = new SqliteInstanceRepository(reopened);

      const loaded = repository.get();

      expect(loaded?.instanceId).toBe(created.instanceId);

      expect(loaded?.version).toBe(1);
    } finally {
      reopened.close();
    }
  });

  it('bootstraps idempotently without regenerating identity', () => {
    const database = migrate(createDatabasePath());

    try {
      const repository = new SqliteInstanceRepository(database);

      const first = bootstrapInstance(repository, {
        schemaVersion: 2,
        applicationVersion: 'test-version',
      });

      const second = bootstrapInstance(repository, {
        schemaVersion: 99,
        applicationVersion: 'different-version',
      });

      expect(second.instanceId).toBe(first.instanceId);

      expect(second.schemaVersion).toBe(first.schemaVersion);
    } finally {
      database.close();
    }
  });

  it('enforces a single persisted Instance', () => {
    const database = migrate(createDatabasePath());

    try {
      const repository = new SqliteInstanceRepository(database);

      const first = bootstrapInstance(repository, {
        schemaVersion: 2,
        applicationVersion: 'test-version',
      });

      expect(() =>
        repository.insert({
          ...first,
          instanceId: InstanceId.generate(),
        }),
      ).toThrow(InstanceAlreadyExistsError);
    } finally {
      database.close();
    }
  });

  it('updates with optimistic versioning', () => {
    const database = migrate(createDatabasePath());

    try {
      const repository = new SqliteInstanceRepository(database);

      const original = bootstrapInstance(repository, {
        schemaVersion: 2,
        applicationVersion: 'v1',
      });

      const updated = repository.update(
        {
          displayName: 'My ChannelForge',
          defaultTimeZone: 'America/Los_Angeles',
          setupState: 'READY',
          schemaVersion: 2,
          applicationVersion: 'v2',
          updatedAt: '2026-08-18T09:31:00.000Z',
        },
        original.version,
      );

      expect(updated.version).toBe(2);

      expect(updated.displayName).toBe('My ChannelForge');

      expect(() =>
        repository.update(
          {
            displayName: 'Stale write',
            defaultTimeZone: 'UTC',
            setupState: 'READY',
            schemaVersion: 2,
            applicationVersion: 'stale',
            updatedAt: '2026-08-18T09:32:00.000Z',
          },
          original.version,
        ),
      ).toThrow(StaleInstanceVersionError);
    } finally {
      database.close();
    }
  });

  it('rolls repository writes back transactionally', () => {
    const database = migrate(createDatabasePath());

    try {
      const repository = new SqliteInstanceRepository(database);

      const coordinator = new SqliteTransactionCoordinator(database);

      const original = bootstrapInstance(repository, {
        schemaVersion: 2,
        applicationVersion: 'v1',
      });

      expect(() =>
        coordinator.run(() => {
          repository.update(
            {
              displayName: 'Should Roll Back',
              defaultTimeZone: 'UTC',
              setupState: 'READY',
              schemaVersion: 2,
              applicationVersion: 'v2',
              updatedAt: '2026-08-18T09:33:00.000Z',
            },
            original.version,
          );

          throw new Error('force rollback');
        }),
      ).toThrow('force rollback');

      const afterRollback = repository.get();

      expect(afterRollback?.displayName).toBe(original.displayName);

      expect(afterRollback?.version).toBe(original.version);
    } finally {
      database.close();
    }
  });
});
