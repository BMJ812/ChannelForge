import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0006LegacyIdentityTombstone: SchemaMigration =
  Object.freeze({
    id: '0006_legacy_identity_tombstone',

    name: 'Create durable legacy identity tombstones',

    statements: Object.freeze([
      `
        CREATE TABLE IF NOT EXISTS
          cf_legacy_identity_tombstone (
            tombstone_id TEXT PRIMARY KEY,

            legacy_namespace TEXT NOT NULL
              CHECK (
                length(
                  trim(
                    legacy_namespace
                  )
                ) > 0
              ),

            legacy_entity_type TEXT NOT NULL
              CHECK (
                length(
                  trim(
                    legacy_entity_type
                  )
                ) > 0
              ),

            legacy_identifier TEXT NOT NULL
              CHECK (
                length(
                  trim(
                    legacy_identifier
                  )
                ) > 0
              ),

            tombstone_reason TEXT NOT NULL
              CHECK (
                tombstone_reason IN (
                  'RETIRED',
                  'MERGED',
                  'INVALID',
                  'OMITTED',
                  'REPLACED',
                  'DELETED'
                )
              ),

            replacement_entity_type TEXT,
            replacement_identifier TEXT,

            migration_run_id TEXT,
            conflict_id TEXT,

            created_at TEXT NOT NULL,

            metadata_json TEXT NOT NULL
              DEFAULT '{}',

            CHECK (
              (
                replacement_entity_type IS NULL
                AND replacement_identifier IS NULL
              )
              OR
              (
                replacement_entity_type IS NOT NULL
                AND replacement_identifier IS NOT NULL
                AND length(
                  trim(
                    replacement_entity_type
                  )
                ) > 0
                AND length(
                  trim(
                    replacement_identifier
                  )
                ) > 0
              )
            ),

            FOREIGN KEY (
              migration_run_id
            )
              REFERENCES cf_migration_run (
                migration_run_id
              )
              ON DELETE SET NULL,

            FOREIGN KEY (
              conflict_id
            )
              REFERENCES cf_migration_conflict (
                migration_conflict_id
              )
              ON DELETE SET NULL,

            UNIQUE (
              legacy_namespace,
              legacy_entity_type,
              legacy_identifier
            )
          )
      `,

      `
        CREATE INDEX IF NOT EXISTS
          cf_legacy_identity_tombstone_reason_idx
        ON cf_legacy_identity_tombstone (
          tombstone_reason,
          created_at
        )
      `,

      `
        CREATE INDEX IF NOT EXISTS
          cf_legacy_identity_tombstone_run_idx
        ON cf_legacy_identity_tombstone (
          migration_run_id
        )
      `,
    ]),
  });
