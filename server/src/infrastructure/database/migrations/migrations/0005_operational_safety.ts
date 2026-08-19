import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0005OperationalSafety: SchemaMigration = Object.freeze({
  id: '0005_operational_safety',
  name: 'Create audit, idempotency, and migration lease records',
  statements: Object.freeze([
    `
        CREATE TABLE IF NOT EXISTS cf_audit_record (
          audit_record_id TEXT PRIMARY KEY,

          occurred_at TEXT NOT NULL,

          actor_type TEXT NOT NULL
            CHECK (
              length(trim(actor_type)) > 0
            ),

          actor_id TEXT,

          action TEXT NOT NULL
            CHECK (
              length(trim(action)) > 0
            ),

          target_type TEXT NOT NULL
            CHECK (
              length(trim(target_type)) > 0
            ),

          target_id TEXT,

          outcome TEXT NOT NULL
            CHECK (
              outcome IN (
                'SUCCESS',
                'FAILURE'
              )
            ),

          migration_run_id TEXT,

          correlation_id TEXT,
          request_id TEXT,

          details_json TEXT NOT NULL
            DEFAULT '{}',

          FOREIGN KEY (migration_run_id)
            REFERENCES cf_migration_run (
              migration_run_id
            )
            ON DELETE SET NULL
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_audit_record_target_time_idx
        ON cf_audit_record (
          target_type,
          target_id,
          occurred_at
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_audit_record_action_time_idx
        ON cf_audit_record (
          action,
          occurred_at
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_audit_record_migration_run_idx
        ON cf_audit_record (
          migration_run_id,
          occurred_at
        )
      `,
    `
        CREATE TABLE IF NOT EXISTS cf_idempotency_record (
          scope TEXT NOT NULL
            CHECK (
              length(trim(scope)) > 0
            ),

          actor_id TEXT NOT NULL
            DEFAULT '',

          idempotency_key TEXT NOT NULL
            CHECK (
              length(trim(idempotency_key)) > 0
            ),

          request_hash TEXT NOT NULL
            CHECK (
              length(request_hash) = 64
            ),

          status TEXT NOT NULL
            CHECK (
              status IN (
                'IN_PROGRESS',
                'COMPLETED',
                'FAILED'
              )
            ),

          result_reference TEXT,

          created_at TEXT NOT NULL,
          completed_at TEXT,
          expires_at TEXT,
          error_summary TEXT,

          PRIMARY KEY (
            scope,
            actor_id,
            idempotency_key
          ),

          CHECK (
            status != 'COMPLETED'
            OR completed_at IS NOT NULL
          )
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_idempotency_record_expiry_idx
        ON cf_idempotency_record (
          expires_at
        )
      `,
    `
        CREATE TABLE IF NOT EXISTS cf_migration_lease (
          lease_name TEXT PRIMARY KEY
            CHECK (
              length(trim(lease_name)) > 0
            ),

          owner_token TEXT NOT NULL
            CHECK (
              length(trim(owner_token)) > 0
            ),

          acquired_at TEXT NOT NULL,
          heartbeat_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,

          application_version TEXT,
          baseline_commit TEXT
        )
      `,
  ]),
});
