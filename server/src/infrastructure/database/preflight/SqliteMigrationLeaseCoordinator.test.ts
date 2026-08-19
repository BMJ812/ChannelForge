import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import {
  MigrationLeaseLostError,
  MigrationLeaseUnavailableError,
  SqliteMigrationLeaseCoordinator,
} from './SqliteMigrationLeaseCoordinator.js';

const directories: string[] = [];

function createDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-lease-'));

  directories.push(directory);

  return join(directory, 'channelforge.sqlite');
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('SqliteMigrationLeaseCoordinator', () => {
  it('enforces one active owner across SQLite connections and permits stale takeover', () => {
    const filename = createDatabasePath();

    const first = openChannelForgeSqliteConnection(filename);

    new ChannelForgeMigrationRunner(
      first,
      channelForgeSchemaMigrations,
    ).migrate();

    const second = openChannelForgeSqliteConnection(filename);

    try {
      const firstCoordinator = new SqliteMigrationLeaseCoordinator(first);

      const secondCoordinator = new SqliteMigrationLeaseCoordinator(second);

      const firstLease = firstCoordinator.acquire({
        ownerToken: 'owner-one',
        ttlMs: 60_000,
        now: () => new Date('2026-08-19T01:03:00.000Z'),
      });

      expect(() =>
        secondCoordinator.acquire({
          ownerToken: 'owner-two',
          ttlMs: 60_000,
          now: () => new Date('2026-08-19T01:03:30.000Z'),
        }),
      ).toThrow(MigrationLeaseUnavailableError);

      const secondLease = secondCoordinator.acquire({
        ownerToken: 'owner-two',
        ttlMs: 60_000,
        now: () => new Date('2026-08-19T01:04:01.000Z'),
      });

      expect(secondLease.ownerToken).toBe('owner-two');

      expect(() => firstCoordinator.release(firstLease)).toThrow(
        MigrationLeaseLostError,
      );

      secondCoordinator.release(secondLease);
    } finally {
      second.close();
      first.close();
    }
  });

  it('renews a lease only while ownership remains active', () => {
    const filename = createDatabasePath();

    const database = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        database,
        channelForgeSchemaMigrations,
      ).migrate();

      const coordinator = new SqliteMigrationLeaseCoordinator(database);

      const lease = coordinator.acquire({
        ownerToken: 'owner-one',
        ttlMs: 60_000,
        now: () => new Date('2026-08-19T01:05:00.000Z'),
      });

      const renewed = coordinator.renew(
        lease,
        60_000,
        () => new Date('2026-08-19T01:05:30.000Z'),
      );

      expect(renewed.expiresAt).toBe('2026-08-19T01:06:30.000Z');

      coordinator.release(renewed);

      expect(() => coordinator.renew(renewed)).toThrow(MigrationLeaseLostError);
    } finally {
      database.close();
    }
  });
});
