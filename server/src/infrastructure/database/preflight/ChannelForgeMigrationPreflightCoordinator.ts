import {
  ChannelForgeBackupPreflightService,
  type VerifiedBackup,
} from '../backup/ChannelForgeBackupPreflightService.js';

import {
  SqliteMigrationLeaseCoordinator,
  type MigrationLease,
} from './SqliteMigrationLeaseCoordinator.js';

export type MigrationPreflightRequest = Readonly<{
  backupDirectory: string;
  applicationVersion: string;
  schemaVersion: number;
  baselineCommit?: string;
  migrationRunId?: string;
  createdBy?: string;
  retentionUntil?: string;
  leaseTtlMs?: number;
  ownerToken?: string;
  now?: () => Date;
}>;

export type MigrationPreflightSession = Readonly<{
  lease: MigrationLease;
  backup: VerifiedBackup;
}>;

export class ChannelForgeMigrationPreflightCoordinator {
  constructor(
    private readonly leaseCoordinator: SqliteMigrationLeaseCoordinator,

    private readonly backupService: ChannelForgeBackupPreflightService,
  ) {}

  async prepare(
    request: MigrationPreflightRequest,
  ): Promise<MigrationPreflightSession> {
    const lease = this.leaseCoordinator.acquire({
      ownerToken: request.ownerToken,

      ttlMs: request.leaseTtlMs,

      applicationVersion: request.applicationVersion,

      baselineCommit: request.baselineCommit,

      now: request.now,
    });

    try {
      const backup = await this.backupService.createVerifiedBackup({
        backupDirectory: request.backupDirectory,

        applicationVersion: request.applicationVersion,

        schemaVersion: request.schemaVersion,

        createdBy: request.createdBy,

        migrationRunId: request.migrationRunId,

        retentionUntil: request.retentionUntil,

        now: request.now,
      });

      return Object.freeze({
        lease,
        backup,
      });
    } catch (error) {
      try {
        this.leaseCoordinator.release(lease);
      } catch {
        // Preserve the original preflight error.
      }

      throw error;
    }
  }

  release(session: MigrationPreflightSession): void {
    this.leaseCoordinator.release(session.lease);
  }
}
