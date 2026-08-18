import type Database from 'better-sqlite3';

import {
  InstanceAlreadyExistsError,
  InstanceId,
  InstanceNotFoundError,
  StaleInstanceVersionError,
  type InstanceRepository,
  type InstanceSetupState,
  type InstanceUpdate,
  type PersistedInstance,
} from '@/modules/instance/index.js';

type InstanceRecord = Readonly<{
  instance_id: string;
  display_name: string;
  default_time_zone: string;
  setup_state: InstanceSetupState;
  schema_version: number;
  application_version: string;
  created_at: string;
  updated_at: string;
  version: number;
}>;

function mapRecord(row: InstanceRecord): PersistedInstance {
  return Object.freeze({
    instanceId: InstanceId.parse(row.instance_id),

    displayName: row.display_name,

    defaultTimeZone: row.default_time_zone,

    setupState: row.setup_state,

    schemaVersion: row.schema_version,

    applicationVersion: row.application_version,

    createdAt: row.created_at,

    updatedAt: row.updated_at,

    version: row.version,
  });
}

function isSqliteConstraint(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = String(
    (
      error as {
        code?: unknown;
      }
    ).code,
  );

  return code.startsWith('SQLITE_CONSTRAINT');
}

export class SqliteInstanceRepository implements InstanceRepository {
  constructor(private readonly database: Database.Database) {}

  get(): PersistedInstance | undefined {
    const row = this.database
      .prepare(
        `
          SELECT
            instance_id,
            display_name,
            default_time_zone,
            setup_state,
            schema_version,
            application_version,
            created_at,
            updated_at,
            version
          FROM cf_instance
          WHERE singleton_key = 1
        `,
      )
      .get() as InstanceRecord | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  insert(instance: PersistedInstance): void {
    try {
      this.database
        .prepare(
          `
            INSERT INTO cf_instance (
              instance_id,
              singleton_key,
              display_name,
              default_time_zone,
              setup_state,
              schema_version,
              application_version,
              created_at,
              updated_at,
              version
            )
            VALUES (
              ?,
              1,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?
            )
          `,
        )
        .run(
          instance.instanceId,
          instance.displayName,
          instance.defaultTimeZone,
          instance.setupState,
          instance.schemaVersion,
          instance.applicationVersion,
          instance.createdAt,
          instance.updatedAt,
          instance.version,
        );
    } catch (error) {
      if (isSqliteConstraint(error)) {
        throw new InstanceAlreadyExistsError();
      }

      throw error;
    }
  }

  update(update: InstanceUpdate, expectedVersion: number): PersistedInstance {
    const result = this.database
      .prepare(
        `
          UPDATE cf_instance
          SET
            display_name = ?,
            default_time_zone = ?,
            setup_state = ?,
            schema_version = ?,
            application_version = ?,
            updated_at = ?,
            version = version + 1
          WHERE
            singleton_key = 1
            AND version = ?
        `,
      )
      .run(
        update.displayName,
        update.defaultTimeZone,
        update.setupState,
        update.schemaVersion,
        update.applicationVersion,
        update.updatedAt,
        expectedVersion,
      );

    if (result.changes === 0) {
      const current = this.get();

      if (current === undefined) {
        throw new InstanceNotFoundError();
      }

      throw new StaleInstanceVersionError(expectedVersion, current.version);
    }

    const updated = this.get();

    if (updated === undefined) {
      throw new InstanceNotFoundError();
    }

    return updated;
  }
}
