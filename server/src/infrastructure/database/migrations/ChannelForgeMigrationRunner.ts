import Database from 'better-sqlite3';

import {
  checksumSchemaMigration,
  type SchemaMigration,
} from './SchemaMigration.js';

export const SchemaMigrationStatuses = [
  'PENDING',
  'RUNNING',
  'APPLIED',
  'FAILED',
] as const;

export type SchemaMigrationStatus = (typeof SchemaMigrationStatuses)[number];

type SchemaMigrationRow = Readonly<{
  migration_id: string;
  migration_name: string;
  checksum: string;
  status: SchemaMigrationStatus;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  application_version: string | null;
  baseline_commit: string | null;
  error_summary: string | null;
}>;

export type AppliedSchemaMigration = Readonly<{
  migrationId: string;
  migrationName: string;
  checksum: string;
  status: SchemaMigrationStatus;
}>;

export type MigrationExecutionResult = Readonly<{
  applied: readonly string[];
  alreadyApplied: readonly string[];
}>;

export type ChannelForgeMigrationRunnerOptions = Readonly<{
  applicationVersion?: string;
  baselineCommit?: string;
  now?: () => Date;
}>;

export class MigrationChecksumMismatchError extends Error {
  constructor(readonly migrationId: string) {
    super(`Applied migration checksum differs for ${migrationId}`);

    this.name = 'MigrationChecksumMismatchError';
  }
}

export class UnsupportedSchemaAheadError extends Error {
  constructor(readonly unknownAppliedMigrationIds: readonly string[]) {
    super(
      `Database schema is ahead of this application: ${unknownAppliedMigrationIds.join(', ')}`,
    );

    this.name = 'UnsupportedSchemaAheadError';
  }
}

export class DuplicateSchemaMigrationError extends Error {
  constructor(readonly migrationId: string) {
    super(`Duplicate schema migration ID: ${migrationId}`);

    this.name = 'DuplicateSchemaMigrationError';
  }
}

function sanitizeErrorSummary(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message.slice(0, 2_048);
}

export class ChannelForgeMigrationRunner {
  private readonly migrations: readonly SchemaMigration[];
  private readonly now: () => Date;

  constructor(
    private readonly database: Database.Database,
    migrations: readonly SchemaMigration[],
    private readonly options: ChannelForgeMigrationRunnerOptions = {},
  ) {
    this.migrations = this.validateAndOrder(migrations);

    this.now = options.now ?? (() => new Date());
  }

  migrate(): MigrationExecutionResult {
    this.ensureMigrationLedger();
    this.assertNoUnknownAppliedMigrations();

    const applied: string[] = [];
    const alreadyApplied: string[] = [];

    for (const migration of this.migrations) {
      const checksum = checksumSchemaMigration(migration);

      const existing = this.getMigration(migration.id);

      if (existing !== undefined) {
        if (existing.checksum !== checksum) {
          throw new MigrationChecksumMismatchError(migration.id);
        }

        if (existing.status === 'APPLIED') {
          alreadyApplied.push(migration.id);
          continue;
        }
      } else {
        this.database
          .prepare(
            `
              INSERT INTO cf_schema_migration (
                migration_id,
                migration_name,
                checksum,
                status,
                application_version,
                baseline_commit
              )
              VALUES (?, ?, ?, 'PENDING', ?, ?)
            `,
          )
          .run(
            migration.id,
            migration.name,
            checksum,
            this.options.applicationVersion ?? null,
            this.options.baselineCommit ?? null,
          );
      }

      const startedAt = this.now().toISOString();

      this.database
        .prepare(
          `
            UPDATE cf_schema_migration
            SET
              status = 'RUNNING',
              migration_name = ?,
              started_at = ?,
              completed_at = NULL,
              failed_at = NULL,
              error_summary = NULL,
              application_version = ?,
              baseline_commit = ?
            WHERE migration_id = ?
          `,
        )
        .run(
          migration.name,
          startedAt,
          this.options.applicationVersion ?? null,
          this.options.baselineCommit ?? null,
          migration.id,
        );

      try {
        const applyMigration = this.database.transaction(() => {
          for (const statement of migration.statements) {
            this.database.exec(statement);
          }
        });

        applyMigration();

        const completedAt = this.now().toISOString();

        this.database
          .prepare(
            `
              UPDATE cf_schema_migration
              SET
                status = 'APPLIED',
                completed_at = ?,
                failed_at = NULL,
                error_summary = NULL
              WHERE migration_id = ?
            `,
          )
          .run(completedAt, migration.id);

        applied.push(migration.id);
      } catch (error) {
        const failedAt = this.now().toISOString();

        this.database
          .prepare(
            `
              UPDATE cf_schema_migration
              SET
                status = 'FAILED',
                failed_at = ?,
                error_summary = ?
              WHERE migration_id = ?
            `,
          )
          .run(failedAt, sanitizeErrorSummary(error), migration.id);

        throw error;
      }
    }

    return Object.freeze({
      applied: Object.freeze(applied),
      alreadyApplied: Object.freeze(alreadyApplied),
    });
  }

  listMigrations(): readonly AppliedSchemaMigration[] {
    this.ensureMigrationLedger();

    const rows = this.database
      .prepare(
        `
          SELECT
            migration_id,
            migration_name,
            checksum,
            status
          FROM cf_schema_migration
          ORDER BY migration_id ASC
        `,
      )
      .all() as Array<
      Pick<
        SchemaMigrationRow,
        'migration_id' | 'migration_name' | 'checksum' | 'status'
      >
    >;

    return Object.freeze(
      rows.map((row) =>
        Object.freeze({
          migrationId: row.migration_id,
          migrationName: row.migration_name,
          checksum: row.checksum,
          status: row.status,
        }),
      ),
    );
  }

  private assertNoUnknownAppliedMigrations(): void {
    const known = new Set(this.migrations.map((migration) => migration.id));

    const appliedRows = this.database
      .prepare(
        `
          SELECT migration_id
          FROM cf_schema_migration
          WHERE status = 'APPLIED'
          ORDER BY migration_id ASC
        `,
      )
      .all() as Array<{
      migration_id: string;
    }>;

    const unknown = appliedRows
      .map((row) => row.migration_id)
      .filter((migrationId) => !known.has(migrationId));

    if (unknown.length !== 0) {
      throw new UnsupportedSchemaAheadError(Object.freeze(unknown));
    }
  }

  private getMigration(migrationId: string): SchemaMigrationRow | undefined {
    return this.database
      .prepare(
        `
          SELECT
            migration_id,
            migration_name,
            checksum,
            status,
            started_at,
            completed_at,
            failed_at,
            application_version,
            baseline_commit,
            error_summary
          FROM cf_schema_migration
          WHERE migration_id = ?
        `,
      )
      .get(migrationId) as SchemaMigrationRow | undefined;
  }

  private ensureMigrationLedger(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS cf_schema_migration (
        migration_id TEXT PRIMARY KEY,
        migration_name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        status TEXT NOT NULL CHECK (
          status IN (
            'PENDING',
            'RUNNING',
            'APPLIED',
            'FAILED'
          )
        ),
        started_at TEXT,
        completed_at TEXT,
        failed_at TEXT,
        application_version TEXT,
        baseline_commit TEXT,
        error_summary TEXT
      )
    `);
  }

  private validateAndOrder(
    migrations: readonly SchemaMigration[],
  ): readonly SchemaMigration[] {
    const ordered = [...migrations].sort((left, right) =>
      left.id.localeCompare(right.id),
    );

    const seen = new Set<string>();

    for (const migration of ordered) {
      if (seen.has(migration.id)) {
        throw new DuplicateSchemaMigrationError(migration.id);
      }

      seen.add(migration.id);
    }

    return Object.freeze(ordered);
  }
}
