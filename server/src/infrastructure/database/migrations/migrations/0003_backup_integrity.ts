import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0003BackupIntegrity: SchemaMigration = Object.freeze({
  id: '0003_backup_integrity',
  name: 'Create backup and integrity records',
  statements: Object.freeze([
    `
        CREATE TABLE IF NOT EXISTS cf_backup_record (
          backup_id TEXT PRIMARY KEY,

          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL,

          application_version TEXT NOT NULL,

          schema_version INTEGER NOT NULL
            CHECK (schema_version >= 0),

          database_path TEXT NOT NULL,

          database_size INTEGER NOT NULL
            CHECK (database_size >= 0),

          asset_manifest_hash TEXT NOT NULL,

          backup_path TEXT NOT NULL UNIQUE,

          manifest_path TEXT NOT NULL UNIQUE,

          backup_size INTEGER NOT NULL
            CHECK (backup_size >= 0),

          checksum TEXT NOT NULL,

          checksum_algorithm TEXT NOT NULL
            CHECK (
              checksum_algorithm = 'sha256'
            ),

          verification_status TEXT NOT NULL
            CHECK (
              verification_status IN (
                'CREATING',
                'CREATED',
                'VERIFYING',
                'VERIFIED',
                'FAILED',
                'EXPIRED',
                'DELETED'
              )
            ),

          verified_at TEXT,
          retention_until TEXT,

          migration_run_id TEXT,

          error_summary TEXT,

          FOREIGN KEY (migration_run_id)
            REFERENCES cf_migration_run (
              migration_run_id
            )
            ON DELETE SET NULL
        )
      `,
    `
        CREATE TABLE IF NOT EXISTS cf_integrity_check (
          integrity_check_id TEXT PRIMARY KEY,

          target_type TEXT NOT NULL
            CHECK (
              target_type IN (
                'SOURCE_DATABASE',
                'BACKUP_DATABASE'
              )
            ),

          check_mode TEXT NOT NULL
            CHECK (
              check_mode IN (
                'QUICK',
                'FULL'
              )
            ),

          status TEXT NOT NULL
            CHECK (
              status IN (
                'PASSED',
                'FAILED'
              )
            ),

          checked_at TEXT NOT NULL,

          database_path TEXT NOT NULL,

          quick_check_json TEXT NOT NULL,

          foreign_key_violation_count INTEGER NOT NULL
            CHECK (
              foreign_key_violation_count >= 0
            ),

          backup_id TEXT,

          error_summary TEXT,

          FOREIGN KEY (backup_id)
            REFERENCES cf_backup_record (
              backup_id
            )
            ON DELETE SET NULL
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_backup_record_status_idx
        ON cf_backup_record (
          verification_status,
          created_at
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_integrity_check_status_idx
        ON cf_integrity_check (
          status,
          checked_at
        )
      `,
    `
        CREATE INDEX IF NOT EXISTS
          cf_integrity_check_backup_idx
        ON cf_integrity_check (
          backup_id
        )
      `,
  ]),
});
