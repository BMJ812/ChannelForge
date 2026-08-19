import type Database from 'better-sqlite3';

import {
  LegacyIdentityTombstoneConstraintError,
  LegacyIdentityTombstoneId,
  type LegacyIdentityReference,
  type LegacyIdentityTombstone,
  type LegacyIdentityTombstoneIdentifier,
  type LegacyIdentityTombstoneReason,
  type LegacyIdentityTombstoneRepository,
} from '@/modules/migration/index.js';

type LegacyIdentityTombstoneRecord = Readonly<{
  tombstone_id: string;
  legacy_namespace: string;
  legacy_entity_type: string;
  legacy_identifier: string;
  tombstone_reason: LegacyIdentityTombstoneReason;
  replacement_entity_type: string | null;
  replacement_identifier: string | null;
  migration_run_id: string | null;
  conflict_id: string | null;
  created_at: string;
  metadata_json: string;
}>;

const SELECT_COLUMNS = `
  SELECT
    tombstone_id,
    legacy_namespace,
    legacy_entity_type,
    legacy_identifier,
    tombstone_reason,
    replacement_entity_type,
    replacement_identifier,
    migration_run_id,
    conflict_id,
    created_at,
    metadata_json
  FROM cf_legacy_identity_tombstone
`;

function parseMetadata(value: string): Readonly<Record<string, unknown>> {
  const parsed = JSON.parse(value) as unknown;

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Legacy identity tombstone metadata must be a JSON object');
  }

  return Object.freeze({
    ...(parsed as Record<string, unknown>),
  });
}

function mapRecord(
  row: LegacyIdentityTombstoneRecord,
): LegacyIdentityTombstone {
  const hasReplacement =
    row.replacement_entity_type !== null && row.replacement_identifier !== null;

  const hasPartialReplacement =
    (row.replacement_entity_type === null) !==
    (row.replacement_identifier === null);

  if (hasPartialReplacement) {
    throw new Error('Legacy identity tombstone replacement is incomplete');
  }

  return Object.freeze({
    tombstoneId: LegacyIdentityTombstoneId.parse(row.tombstone_id),

    legacy: Object.freeze({
      namespace: row.legacy_namespace,

      entityType: row.legacy_entity_type,

      identifier: row.legacy_identifier,
    }),

    reason: row.tombstone_reason,

    ...(hasReplacement
      ? {
          replacement: Object.freeze({
            entityType: row.replacement_entity_type!,

            identifier: row.replacement_identifier!,
          }),
        }
      : {}),

    ...(row.migration_run_id === null
      ? {}
      : {
          migrationRunId: row.migration_run_id,
        }),

    ...(row.conflict_id === null
      ? {}
      : {
          conflictId: row.conflict_id,
        }),

    createdAt: row.created_at,

    metadata: parseMetadata(row.metadata_json),
  });
}

function isSqliteConstraint(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return String(
    (
      error as {
        code?: unknown;
      }
    ).code,
  ).startsWith('SQLITE_CONSTRAINT');
}

export class SqliteLegacyIdentityTombstoneRepository
  implements LegacyIdentityTombstoneRepository
{
  constructor(private readonly database: Database.Database) {}

  getById(
    tombstoneId: LegacyIdentityTombstoneIdentifier,
  ): LegacyIdentityTombstone | undefined {
    const row = this.database
      .prepare(
        `
            ${SELECT_COLUMNS}
            WHERE
              tombstone_id = ?
          `,
      )
      .get(tombstoneId) as LegacyIdentityTombstoneRecord | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  findByLegacyIdentity(
    legacy: LegacyIdentityReference,
  ): LegacyIdentityTombstone | undefined {
    const row = this.database
      .prepare(
        `
            ${SELECT_COLUMNS}
            WHERE
              legacy_namespace = ?
              AND legacy_entity_type = ?
              AND legacy_identifier = ?
          `,
      )
      .get(legacy.namespace, legacy.entityType, legacy.identifier) as
      | LegacyIdentityTombstoneRecord
      | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  insert(tombstone: LegacyIdentityTombstone): void {
    try {
      this.database
        .prepare(
          `
            INSERT INTO
              cf_legacy_identity_tombstone (
                tombstone_id,
                legacy_namespace,
                legacy_entity_type,
                legacy_identifier,
                tombstone_reason,
                replacement_entity_type,
                replacement_identifier,
                migration_run_id,
                conflict_id,
                created_at,
                metadata_json
              )
            VALUES (
              ?,
              ?,
              ?,
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
          tombstone.tombstoneId,

          tombstone.legacy.namespace,

          tombstone.legacy.entityType,

          tombstone.legacy.identifier,

          tombstone.reason,

          tombstone.replacement?.entityType ?? null,

          tombstone.replacement?.identifier ?? null,

          tombstone.migrationRunId ?? null,

          tombstone.conflictId ?? null,

          tombstone.createdAt,

          JSON.stringify(tombstone.metadata),
        );
    } catch (error) {
      if (isSqliteConstraint(error)) {
        throw new LegacyIdentityTombstoneConstraintError(
          error instanceof Error
            ? error.message
            : 'Legacy identity tombstone constraint failed',
        );
      }

      throw error;
    }
  }
}
