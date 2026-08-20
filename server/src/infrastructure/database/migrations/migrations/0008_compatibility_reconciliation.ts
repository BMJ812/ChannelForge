import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0008CompatibilityReconciliation: SchemaMigration =
  Object.freeze({
    id: '0008_compatibility_reconciliation',
    name: 'Create durable compatibility reconciliation queue and findings',

    statements: Object.freeze([
      `
        CREATE TABLE IF NOT EXISTS
          cf_compatibility_reconciliation_job (
            reconciliation_job_id TEXT PRIMARY KEY,

            concept_type TEXT NOT NULL
              CHECK (length(trim(concept_type)) > 0),

            subject_key TEXT NOT NULL
              CHECK (length(trim(subject_key)) > 0),

            reason TEXT NOT NULL
              CHECK (
                reason IN (
                  'LEGACY_PROJECTION_FAILED',
                  'STATUS_PERSISTENCE_FAILED',
                  'STARTUP_RECOVERY',
                  'PERIODIC',
                  'PRE_CUTOVER',
                  'OPERATOR_REQUEST',
                  'PRE_FREEZE',
                  'RELEASE_VALIDATION'
                )
              ),

            canonical_version TEXT,
            legacy_version TEXT,

            error_code TEXT
              CHECK (
                error_code IS NULL
                OR error_code IN (
                  'COMPATIBILITY_UNAVAILABLE',
                  'COMPATIBILITY_TRANSLATION_FAILED',
                  'COMPATIBILITY_CONFLICT',
                  'LEGACY_WRITE_FROZEN'
                )
              ),

            route_template TEXT,

            operation TEXT NOT NULL
              CHECK (length(trim(operation)) > 0),

            correlation_id TEXT,

            state TEXT NOT NULL
              CHECK (
                state IN (
                  'QUEUED',
                  'RUNNING',
                  'COMPLETED',
                  'FAILED',
                  'CANCELED'
                )
              ),

            checkpoint TEXT,

            attempt_count INTEGER NOT NULL DEFAULT 0
              CHECK (attempt_count >= 0),

            processed_count INTEGER NOT NULL DEFAULT 0
              CHECK (processed_count >= 0),

            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT,

            last_error_code TEXT
              CHECK (
                last_error_code IS NULL
                OR last_error_code IN (
                  'COMPATIBILITY_UNAVAILABLE',
                  'COMPATIBILITY_TRANSLATION_FAILED',
                  'COMPATIBILITY_CONFLICT',
                  'LEGACY_WRITE_FROZEN'
                )
              ),

            CHECK (
              state NOT IN ('COMPLETED', 'FAILED', 'CANCELED')
              OR completed_at IS NOT NULL
            )
          )
      `,

      `
        CREATE INDEX IF NOT EXISTS
          cf_compatibility_reconciliation_job_state_idx
        ON cf_compatibility_reconciliation_job (
          state,
          created_at,
          reconciliation_job_id
        )
      `,

      `
        CREATE UNIQUE INDEX IF NOT EXISTS
          cf_compatibility_reconciliation_job_active_scope_idx
        ON cf_compatibility_reconciliation_job (
          concept_type,
          subject_key
        )
        WHERE state IN ('QUEUED', 'RUNNING')
      `,

      `
        CREATE TABLE IF NOT EXISTS
          cf_compatibility_reconciliation_finding (
            reconciliation_finding_id TEXT PRIMARY KEY,

            reconciliation_job_id TEXT NOT NULL
              REFERENCES cf_compatibility_reconciliation_job (
                reconciliation_job_id
              )
              ON DELETE RESTRICT,

            finding_key TEXT NOT NULL
              CHECK (length(trim(finding_key)) > 0),

            concept_type TEXT NOT NULL
              CHECK (length(trim(concept_type)) > 0),

            subject_key TEXT NOT NULL
              CHECK (length(trim(subject_key)) > 0),

            channelforge_id TEXT,
            legacy_namespace TEXT,
            legacy_id TEXT,

            difference_code TEXT NOT NULL
              CHECK (length(trim(difference_code)) > 0),

            severity TEXT NOT NULL
              CHECK (
                severity IN (
                  'INFO',
                  'WARNING',
                  'ERROR',
                  'CRITICAL'
                )
              ),

            outcome TEXT NOT NULL
              CHECK (
                outcome IN (
                  'EQUAL',
                  'LEGACY_REPAIRED',
                  'CANONICAL_REPAIR_REQUIRED',
                  'CONFLICT',
                  'UNSUPPORTED',
                  'RETRY',
                  'OPERATOR_ACTION'
                )
              ),

            repair_action TEXT,

            attempt_count INTEGER NOT NULL DEFAULT 1
              CHECK (attempt_count > 0),

            status TEXT NOT NULL
              CHECK (
                status IN (
                  'OPEN',
                  'RESOLVED'
                )
              ),

            first_observed_at TEXT NOT NULL,
            last_observed_at TEXT NOT NULL,
            resolved_at TEXT,

            CHECK (
              (
                legacy_namespace IS NULL
                AND legacy_id IS NULL
              )
              OR
              (
                legacy_namespace IS NOT NULL
                AND legacy_id IS NOT NULL
                AND length(trim(legacy_namespace)) > 0
                AND length(trim(legacy_id)) > 0
              )
            ),

            CHECK (
              status <> 'RESOLVED'
              OR resolved_at IS NOT NULL
            ),

            UNIQUE (
              reconciliation_job_id,
              finding_key
            )
          )
      `,

      `
        CREATE INDEX IF NOT EXISTS
          cf_compatibility_reconciliation_finding_job_idx
        ON cf_compatibility_reconciliation_finding (
          reconciliation_job_id,
          status,
          last_observed_at
        )
      `,

      `
        CREATE INDEX IF NOT EXISTS
          cf_compatibility_reconciliation_finding_open_idx
        ON cf_compatibility_reconciliation_finding (
          status,
          severity,
          first_observed_at
        )
      `,
    ]),
  });
