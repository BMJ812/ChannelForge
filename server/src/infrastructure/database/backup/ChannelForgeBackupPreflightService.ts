import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import Database from 'better-sqlite3';

import {
  BackupId,
  IntegrityCheckId,
  type BackupIdentifier,
  type IntegrityCheckIdentifier,
} from '@/modules/migration/index.js';

import {
  SqliteIntegrityVerifier,
  type SqliteIntegrityResult,
} from '../integrity/SqliteIntegrityVerifier.js';

export type BackupVerificationStatus = 'CREATED' | 'VERIFIED' | 'FAILED';

export type CreateVerifiedBackupRequest = Readonly<{
  backupDirectory: string;
  applicationVersion: string;
  schemaVersion: number;
  createdBy?: string;
  migrationRunId?: string;
  retentionUntil?: string;
  now?: () => Date;
}>;

export type VerifiedBackup = Readonly<{
  backupId: BackupIdentifier;
  sourceIntegrityCheckId: IntegrityCheckIdentifier;
  backupIntegrityCheckId: IntegrityCheckIdentifier;
  backupPath: string;
  manifestPath: string;
  checksum: string;
  backupSize: number;
  verificationStatus: 'VERIFIED';
  verifiedAt: string;
}>;

export class BackupSourceUnavailableError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'BackupSourceUnavailableError';
  }
}

export class BackupPreflightIntegrityError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'BackupPreflightIntegrityError';
  }
}

export class BackupVerificationError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'BackupVerificationError';
  }
}

function sanitizeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(
    0,
    2_048,
  );
}

function safeFileToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

async function sha256File(filename: string): Promise<string> {
  return await new Promise((resolveHash, rejectHash) => {
    const hash = createHash('sha256');

    const stream = createReadStream(filename);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('error', rejectHash);

    stream.on('end', () => {
      resolveHash(hash.digest('hex'));
    });
  });
}

type BackupManifest = Readonly<{
  formatVersion: 1;
  backupId: string;
  createdAt: string;
  createdBy: string;
  applicationVersion: string;
  schemaVersion: number;
  migrationRunId?: string;
  sourceDatabasePath: string;
  sourceDatabaseSize: number;
  backupDatabaseFilename: string;
  backupDatabaseSize: number;
  checksumAlgorithm: 'sha256';
  databaseChecksum: string;
  managedAssets: readonly string[];
  assetManifestHash: string;
  minimumRestoreApplication: string;
  maximumTestedRestoreApplication: string;
  encryptionState: 'none';
  verificationStatus: BackupVerificationStatus;
  errorSummary?: string;
  restoreInstructions: string;
}>;

function writeManifest(manifestPath: string, manifest: BackupManifest): void {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: 'utf8',
  });
}

export class ChannelForgeBackupPreflightService {
  constructor(private readonly database: Database.Database) {}

  async createVerifiedBackup(
    request: CreateVerifiedBackupRequest,
  ): Promise<VerifiedBackup> {
    if (this.database.memory) {
      throw new BackupSourceUnavailableError(
        'A filesystem SQLite database is required for backup',
      );
    }

    if (!Number.isInteger(request.schemaVersion) || request.schemaVersion < 0) {
      throw new RangeError('schemaVersion must be a non-negative integer');
    }

    if (request.applicationVersion.trim().length === 0) {
      throw new RangeError('applicationVersion must not be empty');
    }

    const now = request.now ?? (() => new Date());

    const createdAt = now().toISOString();

    const sourcePath = resolve(this.database.name);

    const sourceSize = statSync(sourcePath).size;

    const sourceIntegrityId = IntegrityCheckId.generate();

    const sourceIntegrity = new SqliteIntegrityVerifier(
      this.database,
    ).runQuickCheck();

    this.recordIntegrityCheck({
      integrityCheckId: sourceIntegrityId,

      targetType: 'SOURCE_DATABASE',

      checkedAt: createdAt,

      databasePath: sourcePath,

      result: sourceIntegrity,
    });

    if (sourceIntegrity.status !== 'PASSED') {
      throw new BackupPreflightIntegrityError(
        sourceIntegrity.errorSummary ??
          'Source SQLite integrity verification failed',
      );
    }

    const backupId = BackupId.generate();

    const backupDirectory = resolve(request.backupDirectory);

    mkdirSync(backupDirectory, {
      recursive: true,
    });

    const timestampToken = safeFileToken(createdAt);

    const applicationToken = safeFileToken(request.applicationVersion);

    const runToken = safeFileToken(request.migrationRunId ?? 'standalone');

    const basename = [
      'channelforge',
      timestampToken,
      `app-${applicationToken}`,
      `schema-${request.schemaVersion}`,
      `run-${runToken}`,
      backupId,
    ].join('-');

    const backupPath = join(backupDirectory, `${basename}.sqlite`);

    const manifestPath = join(backupDirectory, `${basename}.manifest.json`);

    await this.database.backup(backupPath);

    const backupSize = statSync(backupPath).size;

    const checksum = await sha256File(backupPath);

    const managedAssets: readonly string[] = Object.freeze([]);

    const assetManifestHash = sha256Text(JSON.stringify(managedAssets));

    const createdBy = request.createdBy ?? 'system';

    const manifestBase = Object.freeze({
      formatVersion: 1 as const,
      backupId,
      createdAt,
      createdBy,
      applicationVersion: request.applicationVersion,
      schemaVersion: request.schemaVersion,
      ...(request.migrationRunId === undefined
        ? {}
        : {
            migrationRunId: request.migrationRunId,
          }),
      sourceDatabasePath: sourcePath,
      sourceDatabaseSize: sourceSize,
      backupDatabaseFilename: `${basename}.sqlite`,
      backupDatabaseSize: backupSize,
      checksumAlgorithm: 'sha256' as const,
      databaseChecksum: checksum,
      managedAssets,
      assetManifestHash,
      minimumRestoreApplication: request.applicationVersion,
      maximumTestedRestoreApplication: request.applicationVersion,
      encryptionState: 'none' as const,
      restoreInstructions:
        'Verify SHA-256 and SQLite integrity before restoring this database with a compatible ChannelForge application.',
    });

    writeManifest(
      manifestPath,
      Object.freeze({
        ...manifestBase,
        verificationStatus: 'CREATED' as const,
      }),
    );

    this.insertBackupRecord({
      backupId,
      createdAt,
      createdBy,
      applicationVersion: request.applicationVersion,
      schemaVersion: request.schemaVersion,
      sourcePath,
      sourceSize,
      assetManifestHash,
      backupPath,
      manifestPath,
      backupSize,
      checksum,
      retentionUntil: request.retentionUntil,
      migrationRunId: request.migrationRunId,
    });

    let backupDatabase: Database.Database | undefined;

    try {
      backupDatabase = new Database(backupPath, {
        readonly: true,
        fileMustExist: true,
      });

      const backupIntegrity = new SqliteIntegrityVerifier(
        backupDatabase,
      ).runQuickCheck();

      const backupIntegrityId = IntegrityCheckId.generate();

      const verifiedAt = now().toISOString();

      this.recordIntegrityCheck({
        integrityCheckId: backupIntegrityId,

        targetType: 'BACKUP_DATABASE',

        checkedAt: verifiedAt,

        databasePath: backupPath,

        backupId,

        result: backupIntegrity,
      });

      if (backupIntegrity.status !== 'PASSED') {
        const summary =
          backupIntegrity.errorSummary ??
          'Backup SQLite integrity verification failed';

        writeManifest(
          manifestPath,
          Object.freeze({
            ...manifestBase,
            verificationStatus: 'FAILED' as const,
            errorSummary: summary,
          }),
        );

        this.updateBackupStatus(backupId, 'FAILED', undefined, summary);

        throw new BackupVerificationError(summary);
      }

      writeManifest(
        manifestPath,
        Object.freeze({
          ...manifestBase,
          verificationStatus: 'VERIFIED' as const,
        }),
      );

      this.updateBackupStatus(backupId, 'VERIFIED', verifiedAt);

      return Object.freeze({
        backupId,
        sourceIntegrityCheckId: sourceIntegrityId,
        backupIntegrityCheckId: backupIntegrityId,
        backupPath,
        manifestPath,
        checksum,
        backupSize,
        verificationStatus: 'VERIFIED',
        verifiedAt,
      });
    } catch (error) {
      if (error instanceof BackupVerificationError) {
        throw error;
      }

      const summary = sanitizeError(error);

      writeManifest(
        manifestPath,
        Object.freeze({
          ...manifestBase,
          verificationStatus: 'FAILED' as const,
          errorSummary: summary,
        }),
      );

      this.updateBackupStatus(backupId, 'FAILED', undefined, summary);

      throw new BackupVerificationError(summary);
    } finally {
      backupDatabase?.close();
    }
  }

  private recordIntegrityCheck(
    input: Readonly<{
      integrityCheckId: IntegrityCheckIdentifier;
      targetType: 'SOURCE_DATABASE' | 'BACKUP_DATABASE';
      checkedAt: string;
      databasePath: string;
      backupId?: BackupIdentifier;
      result: SqliteIntegrityResult;
    }>,
  ): void {
    this.database
      .prepare(
        `
          INSERT INTO cf_integrity_check (
            integrity_check_id,
            target_type,
            check_mode,
            status,
            checked_at,
            database_path,
            quick_check_json,
            foreign_key_violation_count,
            backup_id,
            error_summary
          )
          VALUES (
            ?,
            ?,
            'QUICK',
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
        input.integrityCheckId,
        input.targetType,
        input.result.status,
        input.checkedAt,
        input.databasePath,
        JSON.stringify(input.result.quickCheck),
        input.result.foreignKeyViolations.length,
        input.backupId ?? null,
        input.result.errorSummary ?? null,
      );
  }

  private insertBackupRecord(
    input: Readonly<{
      backupId: BackupIdentifier;
      createdAt: string;
      createdBy: string;
      applicationVersion: string;
      schemaVersion: number;
      sourcePath: string;
      sourceSize: number;
      assetManifestHash: string;
      backupPath: string;
      manifestPath: string;
      backupSize: number;
      checksum: string;
      retentionUntil?: string;
      migrationRunId?: string;
    }>,
  ): void {
    this.database
      .prepare(
        `
          INSERT INTO cf_backup_record (
            backup_id,
            created_at,
            created_by,
            application_version,
            schema_version,
            database_path,
            database_size,
            asset_manifest_hash,
            backup_path,
            manifest_path,
            backup_size,
            checksum,
            checksum_algorithm,
            verification_status,
            verified_at,
            retention_until,
            migration_run_id,
            error_summary
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
            'sha256',
            'CREATED',
            NULL,
            ?,
            ?,
            NULL
          )
        `,
      )
      .run(
        input.backupId,
        input.createdAt,
        input.createdBy,
        input.applicationVersion,
        input.schemaVersion,
        input.sourcePath,
        input.sourceSize,
        input.assetManifestHash,
        input.backupPath,
        input.manifestPath,
        input.backupSize,
        input.checksum,
        input.retentionUntil ?? null,
        input.migrationRunId ?? null,
      );
  }

  private updateBackupStatus(
    backupId: BackupIdentifier,
    status: BackupVerificationStatus,
    verifiedAt?: string,
    errorSummary?: string,
  ): void {
    this.database
      .prepare(
        `
          UPDATE cf_backup_record
          SET
            verification_status = ?,
            verified_at = ?,
            error_summary = ?
          WHERE backup_id = ?
        `,
      )
      .run(status, verifiedAt ?? null, errorSummary ?? null, backupId);
  }
}
