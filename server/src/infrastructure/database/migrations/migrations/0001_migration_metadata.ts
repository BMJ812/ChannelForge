import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0001MigrationMetadata: SchemaMigration = Object.freeze({
  id: '0001_migration_metadata',
  name: 'Create ChannelForge migration metadata',
  statements: Object.freeze([
    `
        CREATE TABLE IF NOT EXISTS cf_migration_run (
          migration_run_id TEXT PRIMARY KEY,
          migration_type TEXT NOT NULL,
          status TEXT NOT NULL CHECK (
            status IN (
              'PLANNED',
              'PREFLIGHT',
              'READY',
              'RUNNING',
              'PAUSED',
              'FAILED',
              'ROLLING_BACK',
              'ROLLED_BACK',
              'COMPLETED',
              'COMPLETED_WITH_WARNINGS',
              'ABORTED'
            )
          ),
          source_version TEXT,
          target_version TEXT,
          started_at TEXT,
          completed_at TEXT,
          failed_at TEXT,
          initiated_by TEXT,
          backup_id TEXT,
          baseline_commit TEXT,
          application_version TEXT,
          current_step TEXT,
          statistics_json TEXT,
          error_summary TEXT
        )
      `,
    `
        CREATE TABLE IF NOT EXISTS cf_migration_step (
          migration_step_id TEXT PRIMARY KEY,
          migration_run_id TEXT NOT NULL,
          step_key TEXT NOT NULL,
          sequence_number INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (
            status IN (
              'PENDING',
              'RUNNING',
              'PAUSED',
              'FAILED',
              'COMPLETED',
              'SKIPPED',
              'ROLLED_BACK'
            )
          ),
          started_at TEXT,
          completed_at TEXT,
          attempt_count INTEGER NOT NULL DEFAULT 0
            CHECK (attempt_count >= 0),
          input_cursor TEXT,
          output_cursor TEXT,
          processed_count INTEGER NOT NULL DEFAULT 0
            CHECK (processed_count >= 0),
          success_count INTEGER NOT NULL DEFAULT 0
            CHECK (success_count >= 0),
          warning_count INTEGER NOT NULL DEFAULT 0
            CHECK (warning_count >= 0),
          failure_count INTEGER NOT NULL DEFAULT 0
            CHECK (failure_count >= 0),
          error_summary TEXT,
          FOREIGN KEY (migration_run_id)
            REFERENCES cf_migration_run (migration_run_id)
            ON DELETE CASCADE,
          UNIQUE (migration_run_id, step_key),
          UNIQUE (migration_run_id, sequence_number)
        )
      `,
    `
        CREATE TABLE IF NOT EXISTS cf_migration_checkpoint (
          migration_run_id TEXT NOT NULL,
          step_key TEXT NOT NULL,
          cursor_type TEXT,
          cursor_value TEXT,
          last_source_identity TEXT,
          last_target_identity TEXT,
          processed_count INTEGER NOT NULL DEFAULT 0
            CHECK (processed_count >= 0),
          updated_at TEXT NOT NULL,
          PRIMARY KEY (
            migration_run_id,
            step_key
          ),
          FOREIGN KEY (
            migration_run_id,
            step_key
          )
            REFERENCES cf_migration_step (
              migration_run_id,
              step_key
            )
            ON DELETE CASCADE
        )
      `,
    `
        CREATE TABLE IF NOT EXISTS cf_migration_conflict (
          migration_conflict_id TEXT PRIMARY KEY,
          migration_run_id TEXT NOT NULL,
          step_key TEXT,
          conflict_type TEXT NOT NULL,
          source_reference TEXT,
          candidate_targets_json TEXT,
          status TEXT NOT NULL CHECK (
            status IN (
              'OPEN',
              'AUTO_RESOLVED',
              'OPERATOR_RESOLVED',
              'IGNORED',
              'SUPERSEDED',
              'ROLLED_BACK'
            )
          ),
          detected_at TEXT NOT NULL,
          resolved_at TEXT,
          resolved_by TEXT,
          resolution TEXT,
          evidence_json TEXT,
          FOREIGN KEY (migration_run_id)
            REFERENCES cf_migration_run (migration_run_id)
            ON DELETE CASCADE
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_migration_run_status_idx
        ON cf_migration_run (status)
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_migration_step_run_status_idx
        ON cf_migration_step (
          migration_run_id,
          status
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_migration_conflict_run_status_idx
        ON cf_migration_conflict (
          migration_run_id,
          status
        )
      `,
  ]),
});
