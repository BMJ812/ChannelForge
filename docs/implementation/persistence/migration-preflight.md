# ChannelForge Migration Exclusivity and Preflight Composition

- **Milestone:** 03
- **Schema migration:** `0005_operational_safety`
- **Status:** Initial implementation

## One Primary Migration Writer

`cf_migration_lease` provides a durable SQLite-backed lease.

Acquisition uses an immediate SQLite transaction so separate application
connections cannot simultaneously claim the same active lease.

The initial lease name is:

```text
schema-migration
```

A lease records:

- Owner token
- Acquisition timestamp
- Heartbeat timestamp
- Expiry timestamp
- Optional application version
- Optional baseline commit

## Stale Recovery

An unexpired lease blocks another owner.

After expiry, a new owner may atomically take over.

The prior owner can no longer renew or release the lease.

## Renewal

The active owner may extend the lease while the persisted lease has not expired.

This unit does not add a background heartbeat worker.

The migration execution layer is responsible for renewing long-running leases.

## Composed Preflight

`ChannelForgeMigrationPreflightCoordinator` composes:

1. Exclusive migration lease acquisition.
2. Existing source SQLite integrity verification.
3. Existing verified SQLite online backup.
4. Independent backup reopen/integrity verification.
5. A returned session that keeps the lease until explicitly released.

If backup/integrity preflight fails, the coordinator releases the lease before
rethrowing the original error.

## Scope

This is the first executable composition of migration exclusivity and backup
safety.

Still deferred:

- Free-space threshold policy
- Full source/target version compatibility matrix
- Permission policy
- Required managed-file accessibility
- Automated lease heartbeat
- Production startup wiring
- Compatibility read cutover
