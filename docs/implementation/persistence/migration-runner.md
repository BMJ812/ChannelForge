# ChannelForge Schema Migration Runner

- **Milestone:** 03
- **Implementation unit:** PR 03C-D
- **Status:** Initial implementation

## Ledger Bootstrap

The runner bootstraps one infrastructure table:

`cf_schema_migration`

The ledger must exist before an ordered migration can record its own state.

All subsequent ChannelForge schema changes are represented by immutable ordered
migration definitions.

## Ordering

Migration IDs are sorted lexicographically before execution.

The initial naming convention is zero-padded numeric prefixes:

`0001_description`

Duplicate migration IDs are rejected.

## Checksums

Each migration checksum is SHA-256 over its canonical migration definition:

- ID
- Name
- Ordered SQL statements

An applied migration whose checksum changes is rejected.

Applied migration definitions are therefore immutable.

Corrections require a new migration.

## State

Schema migration states are:

- `PENDING`
- `RUNNING`
- `APPLIED`
- `FAILED`

Failure state is recorded outside the migration-body transaction so it remains
available after the schema mutation rolls back.

## Transaction Behavior

Each migration body executes in one SQLite transaction.

If any migration statement fails:

- The migration-body transaction rolls back
- The ledger records `FAILED`
- The error is rethrown
- Later migrations do not execute

## Restart Behavior

A migration left in `RUNNING`, `FAILED`, or `PENDING` state may be retried only
with the same checksum.

This initial runner therefore requires schema migrations to be restart-safe.

The first migration uses idempotent `CREATE ... IF NOT EXISTS` statements.

Higher-level data migration checkpoints remain separate from schema migration
execution and are introduced through the Migration module.

## Runtime Cutover

The runner is not yet invoked by inherited Tunarr application startup.

This unit proves migration behavior against real SQLite databases without
changing existing startup or write authority.
