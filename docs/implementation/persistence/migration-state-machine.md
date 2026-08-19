# ChannelForge Migration State Machine

- **Milestone:** 03
- **Status:** Implemented foundation

## Schema Migration

Implemented states:

```text
PENDING -> RUNNING -> APPLIED
                  \-> FAILED
```

A matching incomplete `PENDING`, `RUNNING`, or `FAILED` migration may be retried
when its checksum is unchanged.

An `APPLIED` migration is immutable by checksum.

An unknown applied migration causes schema-ahead rejection.

## Migration Run

Persisted run states:

```text
PLANNED
PREFLIGHT
READY
RUNNING
PAUSED
FAILED
ROLLING_BACK
ROLLED_BACK
COMPLETED
COMPLETED_WITH_WARNINGS
ABORTED
```

Milestone 03 establishes the durable state vocabulary and evidence tables.
Higher-level operator orchestration remains a later integration concern.

## Migration Step

Persisted step states:

```text
PENDING
RUNNING
PAUSED
FAILED
COMPLETED
SKIPPED
ROLLED_BACK
```

Checkpoint state is keyed by Migration Run plus step key.

The M03 batch-resume proof persists target writes and the checkpoint in the same
SQLite transaction.

## Conflict

Persisted conflict states:

```text
OPEN
AUTO_RESOLVED
OPERATOR_RESOLVED
IGNORED
SUPERSEDED
ROLLED_BACK
```

Legacy identity conflicts emitted inside a Migration Run are recorded durably as
`OPEN` before the semantic conflict is returned.

## Backup

The implemented backup service exposes the operational progression:

```text
CREATED -> VERIFIED
       \-> FAILED
```

A backup is usable by migration preflight only after independent reopen,
checksum, SQLite quick-check, and foreign-key verification.

## Lease

Migration exclusivity uses:

```text
absent -> acquired -> renewed -> released
                  \-> expired -> stale takeover
```

An owner that loses the lease cannot renew or release the successor lease.
