import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  BackupPreflightIntegrityError,
  ChannelForgeBackupPreflightService,
} from '../backup/ChannelForgeBackupPreflightService.js';
import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import { ChannelForgeMigrationPreflightCoordinator } from './ChannelForgeMigrationPreflightCoordinator.js';
import {
  MigrationLeaseUnavailableError,
  SqliteMigrationLeaseCoordinator,
} from './SqliteMigrationLeaseCoordinator.js';

const directories: string[] = [];

function createDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-preflight-'));

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

describe('ChannelForgeMigrationPreflightCoordinator', () => {
  it('holds a cross-connection lease while returning a verified backup', async () => {
    const directory = createDirectory();

    const filename = join(directory, 'source.sqlite');

    const first = openChannelForgeSqliteConnection(filename);

    new ChannelForgeMigrationRunner(
      first,
      channelForgeSchemaMigrations,
    ).migrate();

    const second = openChannelForgeSqliteConnection(filename);

    try {
      const firstLeaseCoordinator = new SqliteMigrationLeaseCoordinator(first);

      const coordinator = new ChannelForgeMigrationPreflightCoordinator(
        firstLeaseCoordinator,
        new ChannelForgeBackupPreflightService(first),
      );

      const session = await coordinator.prepare({
        backupDirectory: join(directory, 'backups'),

        applicationVersion: 'test-version',

        schemaVersion: 5,

        ownerToken: 'owner-one',

        leaseTtlMs: 120_000,

        now: () => new Date('2026-08-19T01:06:00.000Z'),
      });

      expect(session.backup.verificationStatus).toBe('VERIFIED');

      expect(() =>
        new SqliteMigrationLeaseCoordinator(second).acquire({
          ownerToken: 'owner-two',

          now: () => new Date('2026-08-19T01:06:30.000Z'),
        }),
      ).toThrow(MigrationLeaseUnavailableError);

      coordinator.release(session);

      const successor = new SqliteMigrationLeaseCoordinator(second).acquire({
        ownerToken: 'owner-two',

        now: () => new Date('2026-08-19T01:06:30.000Z'),
      });

      expect(successor.ownerToken).toBe('owner-two');

      new SqliteMigrationLeaseCoordinator(second).release(successor);
    } finally {
      second.close();
      first.close();
    }
  });

  it('releases the lease when backup integrity preflight fails', async () => {
    const directory = createDirectory();

    const filename = join(directory, 'source.sqlite');

    const database = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      database.pragma('foreign_keys = OFF');

      database.exec(`
        CREATE TABLE corrupt_parent (
          id INTEGER PRIMARY KEY
        );

        CREATE TABLE corrupt_child (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER NOT NULL,
          FOREIGN KEY (parent_id)
            REFERENCES corrupt_parent (id)
        );

        INSERT INTO corrupt_child (
          id,
          parent_id
        )
        VALUES (
          1,
          999
        );
      `);

      database.pragma('foreign_keys = ON');

      const leaseCoordinator = new SqliteMigrationLeaseCoordinator(database);

      const coordinator = new ChannelForgeMigrationPreflightCoordinator(
        leaseCoordinator,
        new ChannelForgeBackupPreflightService(database),
      );

      await expect(
        coordinator.prepare({
          backupDirectory: join(directory, 'backups'),

          applicationVersion: 'test-version',

          schemaVersion: 5,

          ownerToken: 'owner-one',
        }),
      ).rejects.toThrow(BackupPreflightIntegrityError);

      const recovered = leaseCoordinator.acquire({
        ownerToken: 'owner-two',
      });

      expect(recovered.ownerToken).toBe('owner-two');

      leaseCoordinator.release(recovered);
    } finally {
      database.close();
    }
  });
});
