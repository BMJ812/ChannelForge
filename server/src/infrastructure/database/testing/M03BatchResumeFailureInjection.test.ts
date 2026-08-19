import { mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { openChannelForgeSqliteConnection } from '../connection/ChannelForgeSqliteConnection.js';

import { ChannelForgeMigrationRunner } from '../migrations/ChannelForgeMigrationRunner.js';

import { channelForgeSchemaMigrations } from '../migrations/migrations/index.js';

import { SqliteMigrationCheckpointStore } from '../migrations/SqliteMigrationCheckpointStore.js';

import { SqliteTransactionCoordinator } from '../transactions/SqliteTransactionCoordinator.js';

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-batch-resume-'));

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

describe('M03 checkpointed batch resume', () => {
  it('resumes after reopen and rolls back a failed target+checkpoint batch atomically', () => {
    const filename = createFilename();

    const migrationRunId = 'run-batch-resume';

    const stepKey = 'copy-synthetic-rows';

    const sourceIds = ['source-1', 'source-2', 'source-3', 'source-4'] as const;

    const first = openChannelForgeSqliteConnection(filename);

    try {
      new ChannelForgeMigrationRunner(
        first,
        channelForgeSchemaMigrations,
      ).migrate();

      first.exec(`
        CREATE TABLE m03_batch_target (
          source_id TEXT PRIMARY KEY
        );
      `);

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
            'synthetic-batch',
            'RUNNING'
          )
        `,
        )
        .run(migrationRunId);

      first
        .prepare(
          `
          INSERT INTO cf_migration_step (
            migration_step_id,
            migration_run_id,
            step_key,
            sequence_number,
            status
          )
          VALUES (
            'step-batch-resume',
            ?,
            ?,
            1,
            'RUNNING'
          )
        `,
        )
        .run(migrationRunId, stepKey);

      const checkpointStore = new SqliteMigrationCheckpointStore(first);

      new SqliteTransactionCoordinator(first).run(() => {
        for (const sourceId of sourceIds.slice(0, 2)) {
          first
            .prepare(
              `
              INSERT INTO m03_batch_target (
                source_id
              )
              VALUES (?)
            `,
            )
            .run(sourceId);
        }

        checkpointStore.save({
          migrationRunId,
          stepKey,
          cursorType: 'array-index',
          cursorValue: '2',
          lastSourceIdentity: 'source-2',
          lastTargetIdentity: 'source-2',
          processedCount: 2,
          updatedAt: '2026-08-19T02:10:00.000Z',
        });
      });
    } finally {
      first.close();
    }

    const resumed = openChannelForgeSqliteConnection(filename);

    try {
      const checkpointStore = new SqliteMigrationCheckpointStore(resumed);

      expect(checkpointStore.get(migrationRunId, stepKey)).toMatchObject({
        cursorValue: '2',
        processedCount: 2,
      });

      expect(() =>
        new SqliteTransactionCoordinator(resumed).run(() => {
          for (const sourceId of sourceIds.slice(2, 4)) {
            resumed
              .prepare(
                `
                INSERT INTO m03_batch_target (
                  source_id
                )
                VALUES (?)
              `,
              )
              .run(sourceId);
          }

          throw new Error('injected crash before checkpoint');
        }),
      ).toThrow('injected crash before checkpoint');

      const afterFailure = resumed
        .prepare(
          `
            SELECT source_id
            FROM m03_batch_target
            ORDER BY source_id ASC
          `,
        )
        .all() as Array<{
        source_id: string;
      }>;

      expect(afterFailure.map((row) => row.source_id)).toEqual([
        'source-1',
        'source-2',
      ]);

      expect(checkpointStore.get(migrationRunId, stepKey)?.processedCount).toBe(
        2,
      );

      new SqliteTransactionCoordinator(resumed).run(() => {
        for (const sourceId of sourceIds.slice(2, 4)) {
          resumed
            .prepare(
              `
              INSERT INTO m03_batch_target (
                source_id
              )
              VALUES (?)
            `,
            )
            .run(sourceId);
        }

        checkpointStore.save({
          migrationRunId,
          stepKey,
          cursorType: 'array-index',
          cursorValue: '4',
          lastSourceIdentity: 'source-4',
          lastTargetIdentity: 'source-4',
          processedCount: 4,
          updatedAt: '2026-08-19T02:11:00.000Z',
        });
      });

      expect(checkpointStore.get(migrationRunId, stepKey)).toMatchObject({
        cursorValue: '4',
        processedCount: 4,
      });
    } finally {
      resumed.close();
    }

    const verified = openChannelForgeSqliteConnection(filename);

    try {
      expect(
        verified
          .prepare(
            `
            SELECT source_id
            FROM m03_batch_target
            ORDER BY source_id ASC
          `,
          )
          .all(),
      ).toEqual([
        {
          source_id: 'source-1',
        },
        {
          source_id: 'source-2',
        },
        {
          source_id: 'source-3',
        },
        {
          source_id: 'source-4',
        },
      ]);

      expect(
        new SqliteMigrationCheckpointStore(verified).get(
          migrationRunId,
          stepKey,
        )?.processedCount,
      ).toBe(4);
    } finally {
      verified.close();
    }
  });
});
