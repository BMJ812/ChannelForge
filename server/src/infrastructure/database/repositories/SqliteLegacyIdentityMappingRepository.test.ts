import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  LegacyIdentityMappingConflictError,
  LegacyIdentityMappingConstraintError,
  LegacyIdentityMappingId,
  LegacyIdentityMappingService,
} from '@/modules/migration/index.js';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';
import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';
import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';
import { SqliteLegacyIdentityMappingRepository } from './SqliteLegacyIdentityMappingRepository.js';

const directories: string[] = [];

function createDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-legacy-id-'));

  directories.push(directory);

  return join(directory, 'channelforge.sqlite');
}

function openMigratedDatabase(filename: string) {
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

describe('SqliteLegacyIdentityMappingRepository', () => {
  it('persists a verified mapping across database reopen', () => {
    const filename = createDatabasePath();
    const firstDatabase = openMigratedDatabase(filename);

    let mappingId: string;

    try {
      const repository = new SqliteLegacyIdentityMappingRepository(
        firstDatabase,
      );

      const service = new LegacyIdentityMappingService(repository);

      const created = service.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-001',
        },
        channelForge: {
          entityType: 'instance',
          identifier: '8bb4bc83-c694-4d7c-9143-8655a9547d53',
        },
        metadata: {
          source: 'SettingsDB.clientId',
        },
        now: () => new Date('2026-08-18T17:20:00.000Z'),
      });

      mappingId = created.mappingId;

      const verified = service.verifyMapping(
        created.mappingId,
        () => new Date('2026-08-18T17:21:00.000Z'),
      );

      expect(verified.status).toBe('VERIFIED');
    } finally {
      firstDatabase.close();
    }

    const reopened = openMigratedDatabase(filename);

    try {
      const repository = new SqliteLegacyIdentityMappingRepository(reopened);

      const persisted = repository.findByLegacyIdentity({
        namespace: 'tunarr',
        entityType: 'instance',
        identifier: 'legacy-client-001',
      });

      expect(persisted?.mappingId).toBe(mappingId);

      expect(persisted?.status).toBe('VERIFIED');

      expect(persisted?.channelForge.identifier).toBe(
        '8bb4bc83-c694-4d7c-9143-8655a9547d53',
      );
    } finally {
      reopened.close();
    }
  });

  it('returns the same mapping for an identical retry', () => {
    const database = openMigratedDatabase(createDatabasePath());

    try {
      const repository = new SqliteLegacyIdentityMappingRepository(database);

      const service = new LegacyIdentityMappingService(repository);

      const request = {
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-001',
        },
        channelForge: {
          entityType: 'instance',
          identifier: '8bb4bc83-c694-4d7c-9143-8655a9547d53',
        },
      } as const;

      const first = service.ensureOneToOneMapping(request);

      const second = service.ensureOneToOneMapping(request);

      expect(second.mappingId).toBe(first.mappingId);
    } finally {
      database.close();
    }
  });

  it('rejects semantic one-to-one conflicts', () => {
    const database = openMigratedDatabase(createDatabasePath());

    try {
      const repository = new SqliteLegacyIdentityMappingRepository(database);

      const service = new LegacyIdentityMappingService(repository);

      service.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-001',
        },
        channelForge: {
          entityType: 'instance',
          identifier: '8bb4bc83-c694-4d7c-9143-8655a9547d53',
        },
      });

      expect(() =>
        service.ensureOneToOneMapping({
          legacy: {
            namespace: 'tunarr',
            entityType: 'instance',
            identifier: 'legacy-client-001',
          },
          channelForge: {
            entityType: 'instance',
            identifier: 'cc5445d7-5889-459a-a45f-8dfd83a63053',
          },
        }),
      ).toThrow(LegacyIdentityMappingConflictError);

      expect(() =>
        service.ensureOneToOneMapping({
          legacy: {
            namespace: 'tunarr',
            entityType: 'instance',
            identifier: 'legacy-client-002',
          },
          channelForge: {
            entityType: 'instance',
            identifier: '8bb4bc83-c694-4d7c-9143-8655a9547d53',
          },
        }),
      ).toThrow(LegacyIdentityMappingConflictError);
    } finally {
      database.close();
    }
  });

  it('enforces uniqueness in SQLite as a final guard', () => {
    const database = openMigratedDatabase(createDatabasePath());

    try {
      const repository = new SqliteLegacyIdentityMappingRepository(database);

      const service = new LegacyIdentityMappingService(repository);

      const first = service.ensureOneToOneMapping({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: 'legacy-client-001',
        },
        channelForge: {
          entityType: 'instance',
          identifier: '8bb4bc83-c694-4d7c-9143-8655a9547d53',
        },
      });

      expect(() =>
        repository.insert({
          ...first,
          mappingId: LegacyIdentityMappingId.generate(),
          channelForge: {
            entityType: 'instance',
            identifier: 'cc5445d7-5889-459a-a45f-8dfd83a63053',
          },
        }),
      ).toThrow(LegacyIdentityMappingConstraintError);

      expect(() =>
        repository.insert({
          ...first,
          mappingId: LegacyIdentityMappingId.generate(),
          legacy: {
            namespace: 'tunarr',
            entityType: 'instance',
            identifier: 'legacy-client-002',
          },
        }),
      ).toThrow(LegacyIdentityMappingConstraintError);
    } finally {
      database.close();
    }
  });
});
