import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0007CompatibilityStatus: SchemaMigration = Object.freeze({
  id: '0007_compatibility_status',
  name: 'Create durable compatibility write status',

  statements: Object.freeze([
    `
        CREATE TABLE IF NOT EXISTS
          cf_compatibility_status (
            compatibility_status_id TEXT PRIMARY KEY,

            concept_type TEXT NOT NULL
              CHECK (length(trim(concept_type)) > 0),

            subject_key TEXT NOT NULL
              CHECK (length(trim(subject_key)) > 0),

            channelforge_id TEXT,
            legacy_namespace TEXT,
            legacy_id TEXT,

            mode TEXT NOT NULL
              CHECK (
                mode IN (
                  'LEGACY_ONLY',
                  'LEGACY_READ_CANONICAL_WRITE',
                  'CANONICAL_READ_LEGACY_FALLBACK',
                  'CANONICAL_ONLY',
                  'DUAL_COMPARE',
                  'TEMPORARY_WRITE_TRANSLATION',
                  'FROZEN_LEGACY_WRITE',
                  'RETIRED'
                )
              ),

            state TEXT NOT NULL
              CHECK (
                state IN (
                  'CURRENT',
                  'PENDING',
                  'DEGRADED',
                  'FAILED',
                  'CONFLICT',
                  'FROZEN',
                  'RETIRED'
                )
              ),

            canonical_version TEXT,
            legacy_version TEXT,

            last_attempt_at TEXT NOT NULL,
            last_success_at TEXT,

            failure_count INTEGER NOT NULL DEFAULT 0
              CHECK (failure_count >= 0),

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

            retryable INTEGER
              CHECK (
                retryable IS NULL
                OR retryable IN (0, 1)
              ),

            reconciliation_required INTEGER NOT NULL DEFAULT 0
              CHECK (reconciliation_required IN (0, 1)),

            conflict_id TEXT,
            reconciliation_job_id TEXT,

            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,

            version INTEGER NOT NULL DEFAULT 1
              CHECK (version > 0),

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
              state <> 'DEGRADED'
              OR reconciliation_required = 1
            ),

            CHECK (
              state <> 'FAILED'
              OR (
                last_error_code IS NOT NULL
                AND retryable IS NOT NULL
              )
            ),

            CHECK (
              state <> 'CONFLICT'
              OR (
                conflict_id IS NOT NULL
                AND length(trim(conflict_id)) > 0
              )
            ),

            CHECK (
              state <> 'FROZEN'
              OR last_error_code = 'LEGACY_WRITE_FROZEN'
            ),

            UNIQUE (concept_type, subject_key)
          )
      `,

    `
        CREATE INDEX IF NOT EXISTS
          cf_compatibility_status_state_idx
        ON cf_compatibility_status (
          state,
          updated_at
        )
      `,

    `
        CREATE INDEX IF NOT EXISTS
          cf_compatibility_status_reconciliation_idx
        ON cf_compatibility_status (
          reconciliation_required,
          reconciliation_job_id,
          updated_at
        )
      `,
  ]),
});
