import type Database from 'better-sqlite3';

import {
  MigrationConflictId,
  type MigrationConflict,
  type MigrationConflictRepository,
  type MigrationConflictStatus,
} from '@/modules/migration/index.js';

type MigrationConflictRecord = Readonly<{
  migration_conflict_id: string;
  migration_run_id: string;
  step_key: string | null;
  conflict_type: string;
  source_reference: string | null;
  candidate_targets_json: string | null;
  status: MigrationConflictStatus;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution: string | null;
  evidence_json: string | null;
}>;

const SELECT_COLUMNS = `
  SELECT
    migration_conflict_id,
    migration_run_id,
    step_key,
    conflict_type,
    source_reference,
    candidate_targets_json,
    status,
    detected_at,
    resolved_at,
    resolved_by,
    resolution,
    evidence_json
  FROM cf_migration_conflict
`;

function parseStringArray(value: string | null): readonly string[] {
  if (value === null) {
    return Object.freeze([]);
  }

  const parsed = JSON.parse(value) as unknown;

  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== 'string')
  ) {
    throw new Error('Migration conflict targets must be a JSON string array');
  }

  return Object.freeze([...parsed]);
}

function parseObject(value: string | null): Readonly<Record<string, unknown>> {
  if (value === null) {
    return Object.freeze({});
  }

  const parsed = JSON.parse(value) as unknown;

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Migration conflict evidence must be a JSON object');
  }

  return Object.freeze({
    ...(parsed as Record<string, unknown>),
  });
}

function mapRecord(row: MigrationConflictRecord): MigrationConflict {
  return Object.freeze({
    migrationConflictId: MigrationConflictId.parse(row.migration_conflict_id),

    migrationRunId: row.migration_run_id,

    ...(row.step_key === null
      ? {}
      : {
          stepKey: row.step_key,
        }),

    conflictType: row.conflict_type,

    ...(row.source_reference === null
      ? {}
      : {
          sourceReference: row.source_reference,
        }),

    candidateTargets: parseStringArray(row.candidate_targets_json),

    status: row.status,

    detectedAt: row.detected_at,

    ...(row.resolved_at === null
      ? {}
      : {
          resolvedAt: row.resolved_at,
        }),

    ...(row.resolved_by === null
      ? {}
      : {
          resolvedBy: row.resolved_by,
        }),

    ...(row.resolution === null
      ? {}
      : {
          resolution: row.resolution,
        }),

    evidence: parseObject(row.evidence_json),
  });
}

export class SqliteMigrationConflictRepository
  implements MigrationConflictRepository
{
  constructor(private readonly database: Database.Database) {}

  getById(
    migrationConflictId: MigrationConflictId,
  ): MigrationConflict | undefined {
    const row = this.database
      .prepare(
        `
            ${SELECT_COLUMNS}
            WHERE
              migration_conflict_id = ?
          `,
      )
      .get(migrationConflictId) as MigrationConflictRecord | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  listOpenByRun(migrationRunId: string): readonly MigrationConflict[] {
    const rows = this.database
      .prepare(
        `
            ${SELECT_COLUMNS}
            WHERE
              migration_run_id = ?
              AND status = 'OPEN'
            ORDER BY
              detected_at ASC,
              migration_conflict_id ASC
          `,
      )
      .all(migrationRunId) as MigrationConflictRecord[];

    return Object.freeze(rows.map(mapRecord));
  }

  insert(conflict: MigrationConflict): void {
    this.database
      .prepare(
        `
          INSERT INTO cf_migration_conflict (
            migration_conflict_id,
            migration_run_id,
            step_key,
            conflict_type,
            source_reference,
            candidate_targets_json,
            status,
            detected_at,
            resolved_at,
            resolved_by,
            resolution,
            evidence_json
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
            ?
          )
        `,
      )
      .run(
        conflict.migrationConflictId,
        conflict.migrationRunId,
        conflict.stepKey ?? null,
        conflict.conflictType,
        conflict.sourceReference ?? null,
        JSON.stringify(conflict.candidateTargets),
        conflict.status,
        conflict.detectedAt,
        conflict.resolvedAt ?? null,
        conflict.resolvedBy ?? null,
        conflict.resolution ?? null,
        JSON.stringify(conflict.evidence),
      );
  }
}
