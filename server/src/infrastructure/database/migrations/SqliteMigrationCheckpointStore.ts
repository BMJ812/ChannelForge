import type Database from 'better-sqlite3';

export type MigrationCheckpoint = Readonly<{
  migrationRunId: string;
  stepKey: string;
  cursorType?: string;
  cursorValue?: string;
  lastSourceIdentity?: string;
  lastTargetIdentity?: string;
  processedCount: number;
  updatedAt: string;
}>;

type MigrationCheckpointRecord = Readonly<{
  migration_run_id: string;
  step_key: string;
  cursor_type: string | null;
  cursor_value: string | null;
  last_source_identity: string | null;
  last_target_identity: string | null;
  processed_count: number;
  updated_at: string;
}>;

function mapRecord(row: MigrationCheckpointRecord): MigrationCheckpoint {
  return Object.freeze({
    migrationRunId: row.migration_run_id,

    stepKey: row.step_key,

    ...(row.cursor_type === null
      ? {}
      : {
          cursorType: row.cursor_type,
        }),

    ...(row.cursor_value === null
      ? {}
      : {
          cursorValue: row.cursor_value,
        }),

    ...(row.last_source_identity === null
      ? {}
      : {
          lastSourceIdentity: row.last_source_identity,
        }),

    ...(row.last_target_identity === null
      ? {}
      : {
          lastTargetIdentity: row.last_target_identity,
        }),

    processedCount: row.processed_count,

    updatedAt: row.updated_at,
  });
}

export class SqliteMigrationCheckpointStore {
  constructor(private readonly database: Database.Database) {}

  get(
    migrationRunId: string,
    stepKey: string,
  ): MigrationCheckpoint | undefined {
    const row = this.database
      .prepare(
        `
            SELECT
              migration_run_id,
              step_key,
              cursor_type,
              cursor_value,
              last_source_identity,
              last_target_identity,
              processed_count,
              updated_at
            FROM cf_migration_checkpoint
            WHERE
              migration_run_id = ?
              AND step_key = ?
          `,
      )
      .get(migrationRunId, stepKey) as MigrationCheckpointRecord | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  save(checkpoint: MigrationCheckpoint): void {
    if (
      !Number.isInteger(checkpoint.processedCount) ||
      checkpoint.processedCount < 0
    ) {
      throw new RangeError('processedCount must be a non-negative integer');
    }

    this.database
      .prepare(
        `
          INSERT INTO cf_migration_checkpoint (
            migration_run_id,
            step_key,
            cursor_type,
            cursor_value,
            last_source_identity,
            last_target_identity,
            processed_count,
            updated_at
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
          ON CONFLICT (
            migration_run_id,
            step_key
          )
          DO UPDATE SET
            cursor_type =
              excluded.cursor_type,
            cursor_value =
              excluded.cursor_value,
            last_source_identity =
              excluded.last_source_identity,
            last_target_identity =
              excluded.last_target_identity,
            processed_count =
              excluded.processed_count,
            updated_at =
              excluded.updated_at
        `,
      )
      .run(
        checkpoint.migrationRunId,
        checkpoint.stepKey,
        checkpoint.cursorType ?? null,
        checkpoint.cursorValue ?? null,
        checkpoint.lastSourceIdentity ?? null,
        checkpoint.lastTargetIdentity ?? null,
        checkpoint.processedCount,
        checkpoint.updatedAt,
      );
  }
}
