import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0004LegacyIdentityMapping: SchemaMigration =
  Object.freeze({
    id: '0004_legacy_identity_mapping',
    name: 'Create durable legacy identity mappings',
    statements: Object.freeze([
      `
        CREATE TABLE IF NOT EXISTS
          cf_legacy_identity_mapping (
            mapping_id TEXT PRIMARY KEY,

            legacy_namespace TEXT NOT NULL
              CHECK (length(trim(legacy_namespace)) > 0),

            legacy_entity_type TEXT NOT NULL
              CHECK (length(trim(legacy_entity_type)) > 0),

            legacy_identifier TEXT NOT NULL
              CHECK (length(trim(legacy_identifier)) > 0),

            channelforge_entity_type TEXT NOT NULL
              CHECK (length(trim(channelforge_entity_type)) > 0),

            channelforge_identifier TEXT NOT NULL
              CHECK (length(trim(channelforge_identifier)) > 0),

            mapping_cardinality TEXT NOT NULL
              CHECK (mapping_cardinality = 'ONE_TO_ONE'),

            mapping_status TEXT NOT NULL
              CHECK (
                mapping_status IN (
                  'PENDING',
                  'MAPPED',
                  'VERIFIED',
                  'CONFLICT',
                  'IGNORED',
                  'SUPERSEDED',
                  'ROLLED_BACK'
                )
              ),

            migration_run_id TEXT,
            created_at TEXT NOT NULL,
            verified_at TEXT,
            conflict_id TEXT,
            metadata_json TEXT NOT NULL DEFAULT '{}',

            CHECK (
              mapping_status != 'VERIFIED'
              OR verified_at IS NOT NULL
            ),

            FOREIGN KEY (migration_run_id)
              REFERENCES cf_migration_run (
                migration_run_id
              )
              ON DELETE SET NULL,

            FOREIGN KEY (conflict_id)
              REFERENCES cf_migration_conflict (
                migration_conflict_id
              )
              ON DELETE SET NULL,

            UNIQUE (
              legacy_namespace,
              legacy_entity_type,
              legacy_identifier
            ),

            UNIQUE (
              channelforge_entity_type,
              channelforge_identifier
            )
          )
      `,
      `
        CREATE INDEX IF NOT EXISTS
          cf_legacy_identity_mapping_status_idx
        ON cf_legacy_identity_mapping (
          mapping_status,
          created_at
        )
      `,
      `
        CREATE INDEX IF NOT EXISTS
          cf_legacy_identity_mapping_run_idx
        ON cf_legacy_identity_mapping (
          migration_run_id
        )
      `,
    ]),
  });
