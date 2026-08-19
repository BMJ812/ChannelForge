import { randomUUID } from 'node:crypto';

import type Database from 'better-sqlite3';

export type MigrationLease = Readonly<{
  leaseName: string;
  ownerToken: string;
  acquiredAt: string;
  heartbeatAt: string;
  expiresAt: string;
}>;

export type AcquireMigrationLeaseRequest = Readonly<{
  leaseName?: string;
  ownerToken?: string;
  ttlMs?: number;
  applicationVersion?: string;
  baselineCommit?: string;
  now?: () => Date;
}>;

export class MigrationLeaseUnavailableError extends Error {
  constructor(readonly activeLease: MigrationLease) {
    super(
      `Migration lease "${activeLease.leaseName}" is held until ${activeLease.expiresAt}`,
    );

    this.name = 'MigrationLeaseUnavailableError';
  }
}

export class MigrationLeaseLostError extends Error {
  constructor(leaseName: string) {
    super(`Migration lease "${leaseName}" is no longer owned by this process`);

    this.name = 'MigrationLeaseLostError';
  }
}

type LeaseRow = Readonly<{
  lease_name: string;
  owner_token: string;
  acquired_at: string;
  heartbeat_at: string;
  expires_at: string;
}>;

function mapLease(row: LeaseRow): MigrationLease {
  return Object.freeze({
    leaseName: row.lease_name,
    ownerToken: row.owner_token,
    acquiredAt: row.acquired_at,
    heartbeatAt: row.heartbeat_at,
    expiresAt: row.expires_at,
  });
}

function requireTtl(ttlMs: number): number {
  if (!Number.isInteger(ttlMs) || ttlMs <= 0) {
    throw new RangeError('Migration lease TTL must be a positive integer');
  }

  return ttlMs;
}

export class SqliteMigrationLeaseCoordinator {
  constructor(private readonly database: Database.Database) {}

  acquire(request: AcquireMigrationLeaseRequest = {}): MigrationLease {
    const leaseName = request.leaseName ?? 'schema-migration';

    const ownerToken = request.ownerToken ?? randomUUID();

    const ttlMs = requireTtl(request.ttlMs ?? 60_000);

    const now = request.now ?? (() => new Date());

    const transaction = this.database.transaction(() => {
      const currentDate = now();

      const currentIso = currentDate.toISOString();

      const expiresIso = new Date(currentDate.getTime() + ttlMs).toISOString();

      const existing = this.database
        .prepare(
          `
                  SELECT
                    lease_name,
                    owner_token,
                    acquired_at,
                    heartbeat_at,
                    expires_at
                  FROM cf_migration_lease
                  WHERE lease_name = ?
                `,
        )
        .get(leaseName) as LeaseRow | undefined;

      if (
        existing !== undefined &&
        existing.owner_token !== ownerToken &&
        Date.parse(existing.expires_at) > currentDate.getTime()
      ) {
        throw new MigrationLeaseUnavailableError(mapLease(existing));
      }

      if (
        existing !== undefined &&
        existing.owner_token === ownerToken &&
        Date.parse(existing.expires_at) > currentDate.getTime()
      ) {
        return mapLease(existing);
      }

      this.database
        .prepare(
          `
                INSERT INTO cf_migration_lease (
                  lease_name,
                  owner_token,
                  acquired_at,
                  heartbeat_at,
                  expires_at,
                  application_version,
                  baseline_commit
                )
                VALUES (
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?
                )
                ON CONFLICT (
                  lease_name
                )
                DO UPDATE SET
                  owner_token =
                    excluded.owner_token,
                  acquired_at =
                    excluded.acquired_at,
                  heartbeat_at =
                    excluded.heartbeat_at,
                  expires_at =
                    excluded.expires_at,
                  application_version =
                    excluded.application_version,
                  baseline_commit =
                    excluded.baseline_commit
              `,
        )
        .run(
          leaseName,
          ownerToken,
          currentIso,
          currentIso,
          expiresIso,
          request.applicationVersion ?? null,
          request.baselineCommit ?? null,
        );

      return Object.freeze({
        leaseName,
        ownerToken,
        acquiredAt: currentIso,
        heartbeatAt: currentIso,
        expiresAt: expiresIso,
      });
    });

    return transaction.immediate();
  }

  renew(
    lease: MigrationLease,
    ttlMs = 60_000,
    now: () => Date = () => new Date(),
  ): MigrationLease {
    const validatedTtl = requireTtl(ttlMs);

    const current = now();

    const heartbeatAt = current.toISOString();

    const expiresAt = new Date(current.getTime() + validatedTtl).toISOString();

    const result = this.database
      .prepare(
        `
            UPDATE cf_migration_lease
            SET
              heartbeat_at = ?,
              expires_at = ?
            WHERE
              lease_name = ?
              AND owner_token = ?
              AND expires_at > ?
          `,
      )
      .run(
        heartbeatAt,
        expiresAt,
        lease.leaseName,
        lease.ownerToken,
        heartbeatAt,
      );

    if (result.changes !== 1) {
      throw new MigrationLeaseLostError(lease.leaseName);
    }

    return Object.freeze({
      ...lease,
      heartbeatAt,
      expiresAt,
    });
  }

  release(lease: MigrationLease): void {
    const result = this.database
      .prepare(
        `
            DELETE FROM
              cf_migration_lease
            WHERE
              lease_name = ?
              AND owner_token = ?
          `,
      )
      .run(lease.leaseName, lease.ownerToken);

    if (result.changes !== 1) {
      throw new MigrationLeaseLostError(lease.leaseName);
    }
  }
}
