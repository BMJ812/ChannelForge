import type Database from 'better-sqlite3';

import {
  CompatibilityStatusConcurrencyError,
  CompatibilityStatusConstraintError,
  CompatibilityStatusId,
  type CompatibilityStatusRecord,
  type CompatibilityStatusRepository,
  type CompatibilityStatusScope,
  type CompatibilityWriteStatus,
} from '@/compatibility/tunarr/ports/index.js';

type CompatibilityStatusRow = Readonly<{
  compatibility_status_id: string;
  concept_type: string;
  subject_key: string;
  channelforge_id: string | null;
  legacy_namespace: string | null;
  legacy_id: string | null;
  mode: CompatibilityStatusRecord['mode'];
  state: CompatibilityWriteStatus['state'];
  canonical_version: string | null;
  legacy_version: string | null;
  last_attempt_at: string;
  last_success_at: string | null;
  failure_count: number;
  last_error_code: CompatibilityStatusRecord['lastErrorCode'] | null;
  retryable: number | null;
  reconciliation_required: number;
  conflict_id: string | null;
  reconciliation_job_id: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}>;

const SELECT_COLUMNS = `
  SELECT
    compatibility_status_id,
    concept_type,
    subject_key,
    channelforge_id,
    legacy_namespace,
    legacy_id,
    mode,
    state,
    canonical_version,
    legacy_version,
    last_attempt_at,
    last_success_at,
    failure_count,
    last_error_code,
    retryable,
    reconciliation_required,
    conflict_id,
    reconciliation_job_id,
    created_at,
    updated_at,
    version
  FROM cf_compatibility_status
`;

function mapStatus(row: CompatibilityStatusRow): CompatibilityWriteStatus {
  switch (row.state) {
    case 'CURRENT':
      return { state: 'CURRENT' };

    case 'PENDING':
      return { state: 'PENDING' };

    case 'DEGRADED':
      if (row.reconciliation_required !== 1) {
        throw new Error(
          'DEGRADED compatibility status must require reconciliation',
        );
      }

      return {
        state: 'DEGRADED',
        reconciliationRequired: true,
        ...(row.last_error_code == null
          ? {}
          : { errorCode: row.last_error_code }),
      };

    case 'FAILED':
      if (row.last_error_code == null || row.retryable == null) {
        throw new Error('FAILED compatibility status is incomplete');
      }

      return {
        state: 'FAILED',
        errorCode: row.last_error_code,
        retryable: row.retryable === 1,
      };

    case 'CONFLICT':
      if (row.conflict_id === null) {
        throw new Error('CONFLICT compatibility status requires conflict ID');
      }

      return {
        state: 'CONFLICT',
        conflictId: row.conflict_id,
      };

    case 'FROZEN':
      if (row.last_error_code !== 'LEGACY_WRITE_FROZEN') {
        throw new Error(
          'FROZEN compatibility status requires LEGACY_WRITE_FROZEN',
        );
      }

      return {
        state: 'FROZEN',
        errorCode: 'LEGACY_WRITE_FROZEN',
      };

    case 'RETIRED':
      return { state: 'RETIRED' };
  }
}

function mapRecord(row: CompatibilityStatusRow): CompatibilityStatusRecord {
  const hasLegacy = row.legacy_namespace !== null && row.legacy_id !== null;

  if ((row.legacy_namespace === null) !== (row.legacy_id === null)) {
    throw new Error('Compatibility status legacy identity is incomplete');
  }

  return Object.freeze({
    statusId: CompatibilityStatusId.parse(row.compatibility_status_id),
    conceptType: row.concept_type,
    subjectKey: row.subject_key,
    ...(row.channelforge_id === null
      ? {}
      : { channelForgeId: row.channelforge_id }),
    ...(hasLegacy
      ? {
          legacyNamespace: row.legacy_namespace!,
          legacyId: row.legacy_id!,
        }
      : {}),
    mode: row.mode,
    status: mapStatus(row),
    ...(row.canonical_version === null
      ? {}
      : { canonicalVersion: row.canonical_version }),
    ...(row.legacy_version === null
      ? {}
      : { legacyVersion: row.legacy_version }),
    lastAttemptAt: row.last_attempt_at,
    ...(row.last_success_at === null
      ? {}
      : { lastSuccessAt: row.last_success_at }),
    failureCount: row.failure_count,
    ...(row.last_error_code == null
      ? {}
      : { lastErrorCode: row.last_error_code }),
    ...(row.reconciliation_job_id === null
      ? {}
      : { reconciliationJobId: row.reconciliation_job_id }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  });
}

function stateColumns(record: CompatibilityStatusRecord) {
  switch (record.status.state) {
    case 'FAILED':
      return {
        retryable: record.status.retryable ? 1 : 0,
        reconciliationRequired: 0,
        conflictId: null,
      };

    case 'DEGRADED':
      return {
        retryable: null,
        reconciliationRequired: 1,
        conflictId: null,
      };

    case 'CONFLICT':
      return {
        retryable: null,
        reconciliationRequired: 0,
        conflictId: record.status.conflictId,
      };

    default:
      return {
        retryable: null,
        reconciliationRequired: 0,
        conflictId: null,
      };
  }
}

function isSqliteConstraint(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return String((error as { code?: unknown }).code).startsWith(
    'SQLITE_CONSTRAINT',
  );
}

export class SqliteCompatibilityStatusRepository
  implements CompatibilityStatusRepository
{
  constructor(private readonly database: Database.Database) {}

  findByScope(
    scope: CompatibilityStatusScope,
  ): CompatibilityStatusRecord | undefined {
    const row = this.database
      .prepare(
        `
          ${SELECT_COLUMNS}
          WHERE concept_type = ?
            AND subject_key = ?
        `,
      )
      .get(scope.conceptType, scope.subjectKey) as
      | CompatibilityStatusRow
      | undefined;

    return row === undefined ? undefined : mapRecord(row);
  }

  insert(record: CompatibilityStatusRecord): void {
    const state = stateColumns(record);

    try {
      this.database
        .prepare(
          `
            INSERT INTO cf_compatibility_status (
              compatibility_status_id,
              concept_type,
              subject_key,
              channelforge_id,
              legacy_namespace,
              legacy_id,
              mode,
              state,
              canonical_version,
              legacy_version,
              last_attempt_at,
              last_success_at,
              failure_count,
              last_error_code,
              retryable,
              reconciliation_required,
              conflict_id,
              reconciliation_job_id,
              created_at,
              updated_at,
              version
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
          `,
        )
        .run(
          record.statusId,
          record.conceptType,
          record.subjectKey,
          record.channelForgeId ?? null,
          record.legacyNamespace ?? null,
          record.legacyId ?? null,
          record.mode,
          record.status.state,
          record.canonicalVersion ?? null,
          record.legacyVersion ?? null,
          record.lastAttemptAt,
          record.lastSuccessAt ?? null,
          record.failureCount,
          record.lastErrorCode ?? null,
          state.retryable,
          state.reconciliationRequired,
          state.conflictId,
          record.reconciliationJobId ?? null,
          record.createdAt,
          record.updatedAt,
          record.version,
        );
    } catch (error) {
      if (isSqliteConstraint(error)) {
        throw new CompatibilityStatusConstraintError(
          error instanceof Error
            ? error.message
            : 'Compatibility status constraint failed',
        );
      }
      throw error;
    }
  }

  update(record: CompatibilityStatusRecord, expectedVersion: number): void {
    if (record.version !== expectedVersion + 1) {
      throw new CompatibilityStatusConcurrencyError(
        'Compatibility status version must advance by exactly one',
      );
    }

    const state = stateColumns(record);

    try {
      const result = this.database
        .prepare(
          `
            UPDATE cf_compatibility_status
            SET
              channelforge_id = ?,
              legacy_namespace = ?,
              legacy_id = ?,
              mode = ?,
              state = ?,
              canonical_version = ?,
              legacy_version = ?,
              last_attempt_at = ?,
              last_success_at = ?,
              failure_count = ?,
              last_error_code = ?,
              retryable = ?,
              reconciliation_required = ?,
              conflict_id = ?,
              reconciliation_job_id = ?,
              updated_at = ?,
              version = ?
            WHERE compatibility_status_id = ?
              AND concept_type = ?
              AND subject_key = ?
              AND version = ?
          `,
        )
        .run(
          record.channelForgeId ?? null,
          record.legacyNamespace ?? null,
          record.legacyId ?? null,
          record.mode,
          record.status.state,
          record.canonicalVersion ?? null,
          record.legacyVersion ?? null,
          record.lastAttemptAt,
          record.lastSuccessAt ?? null,
          record.failureCount,
          record.lastErrorCode ?? null,
          state.retryable,
          state.reconciliationRequired,
          state.conflictId,
          record.reconciliationJobId ?? null,
          record.updatedAt,
          record.version,
          record.statusId,
          record.conceptType,
          record.subjectKey,
          expectedVersion,
        );

      if (result.changes !== 1) {
        throw new CompatibilityStatusConcurrencyError(
          'Compatibility status changed concurrently or no longer exists',
        );
      }
    } catch (error) {
      if (error instanceof CompatibilityStatusConcurrencyError) {
        throw error;
      }

      if (isSqliteConstraint(error)) {
        throw new CompatibilityStatusConstraintError(
          error instanceof Error
            ? error.message
            : 'Compatibility status constraint failed',
        );
      }

      throw error;
    }
  }
}
