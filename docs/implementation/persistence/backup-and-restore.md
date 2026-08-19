# ChannelForge Backup and Restore

- **Milestone:** 03
- **Status:** Verified foundation

## Backup Mechanism

ChannelForge uses SQLite's online backup API through Better SQLite3.

A live database is not backed up by raw filesystem copy.

Before backup, the source runs:

- `PRAGMA quick_check`
- `PRAGMA foreign_key_check`

The backup artifact receives:

- SHA-256 checksum
- manifest
- application version
- schema version
- optional Migration Run ID
- source and backup sizes
- managed-asset manifest
- restore compatibility metadata

The backup database is independently reopened and verified before status becomes
`VERIFIED`.

## Restore Rehearsal

The M03 fixture suite performs a real filesystem restore rehearsal:

1. Build a migrated source database.
2. Persist ChannelForge Instance identity.
3. Persist and verify a Tunarr legacy identity mapping.
4. Create and verify an online SQLite backup.
5. Copy the quiescent verified backup artifact into a restore target.
6. Open the restore target through ChannelForge connection initialization.
7. Re-run migration discovery.
8. Verify the original ChannelForge Instance ID.
9. Verify the mapping remains `VERIFIED`.
10. Run SQLite quick-check and foreign-key-check.

## Managed Assets

No managed external files are required by the current M03-owned state.

The backup manifest therefore intentionally records an empty managed-asset set.

A future migration that makes managed files authoritative must extend the backup
contract before relying on this preflight.

## Restore Compatibility

An application must reject a database containing unknown applied migrations.

This prevents an older ChannelForge build from silently operating against a
newer schema.

## Operator Recovery

The M03 recovery boundary is additive:

- preserve the failed database
- preserve verified backup and manifest
- stop writes
- restore using a compatible application build
- re-run integrity checks
- verify schema migration history
- verify identity mappings
- resume only after verification
