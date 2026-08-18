import type { SchemaMigration } from '../SchemaMigration.js';

export const migration0002InstanceIdentity: SchemaMigration = Object.freeze({
  id: '0002_instance_identity',
  name: 'Create ChannelForge Instance identity',
  statements: Object.freeze([
    `
        CREATE TABLE IF NOT EXISTS cf_instance (
          instance_id TEXT PRIMARY KEY,

          singleton_key INTEGER NOT NULL
            DEFAULT 1
            CHECK (singleton_key = 1)
            UNIQUE,

          display_name TEXT NOT NULL,

          default_time_zone TEXT NOT NULL,

          setup_state TEXT NOT NULL
            CHECK (
              setup_state IN (
                'INITIALIZING',
                'READY'
              )
            ),

          schema_version INTEGER NOT NULL
            CHECK (schema_version >= 0),

          application_version TEXT NOT NULL,

          created_at TEXT NOT NULL,

          updated_at TEXT NOT NULL,

          version INTEGER NOT NULL
            CHECK (version >= 1)
        )
      `,
  ]),
});
