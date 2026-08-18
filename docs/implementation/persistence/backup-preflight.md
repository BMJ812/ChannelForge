# ChannelForge Backup and Integrity Preflight

- **Milestone:** 03
- **Status:** Initial implementation
- **Schema migration:** `0003_backup_integrity`

## Purpose

Critical ChannelForge migration work must not proceed against an unverified
database or without a verified rollback artifact when backup is required.

The initial implementation provides a filesystem-backed SQLite backup and
integrity foundation.

## Source Preflight

Before a backup begins:

1. Run `PRAGMA quick_check`.
2. Run `PRAGMA foreign_key_check`.
3. Persist the result in `cf_integrity_check`.
4. Stop immediately when integrity fails.

A failed source database does not produce a verified backup record.

## SQLite Backup Mechanism

ChannelForge uses the SQLite online backup facility exposed by Better SQLite3.

It does not copy a live SQLite database file directly.

The backup is written to a new destination path and then reopened independently
for verification.

## Backup Verification

After backup creation:

1. Calculate SHA-256 of the backup database.
2. Create a JSON manifest.
3. Open the backup as a separate read-only SQLite database.
4. Run `PRAGMA quick_check`.
5. Run `PRAGMA foreign_key_check`.
6. Persist backup integrity evidence.
7. Mark the backup `VERIFIED` only after both checks pass.

## Backup Manifest

The initial manifest records:

- Backup ID
- Creation timestamp
- Creator
- Application version
- Schema version
- Optional Migration Run ID
- Source database path and size
- Backup database filename and size
- SHA-256 checksum
- Checksum algorithm
- Managed asset list
- Managed asset manifest hash
- Minimum restore application version
- Maximum tested restore application version
- Encryption state
- Verification status
- Restore instructions

## Managed Assets

The current M03 persistence state has no managed-file dependency required to
restore the ChannelForge Instance or migration metadata.

The initial managed-asset manifest is therefore an explicit empty list.

Later migrations that introduce required managed assets must populate and verify
that list before they may rely on this preflight for rollback.

## Backup Records

`cf_backup_record` records successful backup artifacts and their verification
state.

`cf_integrity_check` records source and backup database integrity evidence.

## Failure Policy

A critical migration must not consume a backup unless its record is
`VERIFIED`.

Source integrity failure blocks backup creation.

Backup integrity failure marks the backup record `FAILED`.

## Deferred Preflight Composition

The broader migration preflight coordinator will also compose:

- Free-space policy
- Application/schema compatibility
- Migration exclusivity
- Conflict gating
- Required-file accessibility
- Permission checks
- Downgrade prevention

Those checks are separate from the verified backup primitive implemented here.
