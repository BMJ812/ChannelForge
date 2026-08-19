import type Database from 'better-sqlite3';

import {
  LegacyIdentityMappingConstraintError,
  LegacyIdentityMappingId,
  type ChannelForgeIdentityReference,
  type LegacyIdentityMapping,
  type LegacyIdentityMappingIdentifier,
  type LegacyIdentityMappingRepository,
  type LegacyIdentityMappingStatus,
  type LegacyIdentityReference,
} from '@/modules/migration/index.js';

type LegacyIdentityMappingRecord = Readonly<{
  mapping_id: string;
  legacy_namespace: string;
  legacy_entity_type: string;
  legacy_identifier: string;
  channelforge_entity_type: string;
  channelforge_identifier: string;
  mapping_cardinality: 'ONE_TO_ONE';
  mapping_status: LegacyIdentityMappingStatus;
  migration_run_id: string | null;
  created_at: string;
  verified_at: string | null;
  conflict_id: string | null;
  metadata_json: string;
}>;

const SELECT_COLUMNS = `
  SELECT
    mapping_id,
    legacy_namespace,
    legacy_entity_type,
    legacy_identifier,
    channelforge_entity_type,
    channelforge_identifier,
    mapping_cardinality,
    mapping_status,
    migration_run_id,
    created_at,
    verified_at,
    conflict_id,
    metadata_json
  FROM cf_legacy_identity_mapping
`;

function parseMetadata(value: string): Readonly<Record<string, unknown>> {
  const parsed = JSON.parse(value) as unknown;

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Legacy identity mapping metadata must be a JSON object');
  }

  return Object.freeze({
    ...(parsed as Record<string, unknown>),
  });
}

function mapRecord(row: LegacyIdentityMappingRecord): LegacyIdentityMapping {
  return Object.freeze({
    mappingId: LegacyIdentityMappingId.parse(row.mapping_id),
    legacy: Object.freeze({
      namespace: row.legacy_namespace,
      entityType: row.legacy_entity_type,
      identifier: row.legacy_identifier,
    }),
    channelForge: Object.freeze({
      entityType: row.channelforge_entity_type,
      identifier: row.channelforge_identifier,
    }),
    cardinality: row.mapping_cardinality,
    status: row.mapping_status,
    ...(row.migration_run_id === null
      ? {}
      : { migrationRunId: row.migration_run_id }),
    createdAt: row.created_at,
    ...(row.verified_at === null ? {} : { verifiedAt: row.verified_at }),
    ...(row.conflict_id === null ? {} : { conflictId: row.conflict_id }),
    metadata: parseMetadata(row.metadata_json),
  });
}

function isSqliteConstraint(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return String((error as { code?: unknown }).code).startsWith(
    'SQLITE_CONSTRAINT',
  );
}

export class SqliteLegacyIdentityMappingRepository
  implements LegacyIdentityMappingRepository
{
  constructor(private readonly database: Database.Database) {}

  getById(
    mappingId: LegacyIdentityMappingIdentifier,
  ): LegacyIdentityMapping | undefined {
    const row = this.database
      .prepare(
        `
          ${SELECT_COLUMNS}
          WHERE mapping_id = ?
        `,
      )
      .get(mappingId) as LegacyIdentityMappingRecord | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  findByLegacyIdentity(
    legacy: LegacyIdentityReference,
  ): LegacyIdentityMapping | undefined {
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
      | LegacyIdentityMappingRecord
      | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  findByChannelForgeIdentity(
    channelForge: ChannelForgeIdentityReference,
  ): LegacyIdentityMapping | undefined {
    const row = this.database
      .prepare(
        `
          ${SELECT_COLUMNS}
          WHERE
            channelforge_entity_type = ?
            AND channelforge_identifier = ?
        `,
      )
      .get(channelForge.entityType, channelForge.identifier) as
      | LegacyIdentityMappingRecord
      | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  insert(mapping: LegacyIdentityMapping): void {
    try {
      this.database
        .prepare(
          `
            INSERT INTO
              cf_legacy_identity_mapping (
                mapping_id,
                legacy_namespace,
                legacy_entity_type,
                legacy_identifier,
                channelforge_entity_type,
                channelforge_identifier,
                mapping_cardinality,
                mapping_status,
                migration_run_id,
                created_at,
                verified_at,
                conflict_id,
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
              ?,
              ?,
              ?
            )
          `,
        )
        .run(
          mapping.mappingId,
          mapping.legacy.namespace,
          mapping.legacy.entityType,
          mapping.legacy.identifier,
          mapping.channelForge.entityType,
          mapping.channelForge.identifier,
          mapping.cardinality,
          mapping.status,
          mapping.migrationRunId ?? null,
          mapping.createdAt,
          mapping.verifiedAt ?? null,
          mapping.conflictId ?? null,
          JSON.stringify(mapping.metadata),
        );
    } catch (error) {
      if (isSqliteConstraint(error)) {
        throw new LegacyIdentityMappingConstraintError(
          error instanceof Error
            ? error.message
            : 'Legacy identity mapping constraint failed',
        );
      }

      throw error;
    }
  }

  markVerified(
    mappingId: LegacyIdentityMappingIdentifier,
    verifiedAt: string,
  ): LegacyIdentityMapping {
    const result = this.database
      .prepare(
        `
          UPDATE
            cf_legacy_identity_mapping
          SET
            mapping_status = 'VERIFIED',
            verified_at = ?
          WHERE
            mapping_id = ?
            AND mapping_status = 'MAPPED'
        `,
      )
      .run(verifiedAt, mappingId);

    if (result.changes !== 1) {
      throw new Error('Legacy identity mapping verification update failed');
    }

    const updated = this.getById(mappingId);

    if (updated === undefined) {
      throw new Error('Legacy identity mapping disappeared after verification');
    }

    return updated;
  }
}
