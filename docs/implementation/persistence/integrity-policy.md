# ChannelForge Persistence Integrity Policy

- **Milestone:** 03
- **Status:** Implemented foundation

## Required Checks

The current SQLite verifier runs:

```text
PRAGMA quick_check
PRAGMA foreign_key_check
```

Both must pass for a source database to pass backup preflight.

The independently reopened backup must pass the same checks before it becomes
verified.

## Failure Behavior

A source integrity failure:

- records durable integrity evidence
- blocks verified backup creation
- blocks critical migration preflight
- leaves source state untouched

A restored database is verified again before the restore rehearsal passes.

## Foreign Keys

Every normal ChannelForge SQLite connection enables and verifies foreign-key
enforcement.

Disabling foreign keys is not an accepted repair strategy.

## Failure Injection

M03 also verifies:

- failed schema migration rollback
- corrupt foreign-key source rejection
- failed preflight lease release
- checkpointed batch rollback/resume
- SQLite disk-full transaction rollback
- read-only write denial
- unsupported schema-ahead rejection

Broader domain-specific orphan and revision-hash checks are added with the
domains that own those records.
