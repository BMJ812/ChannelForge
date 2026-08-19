# ChannelForge M03 Migration Fixture Suite

- **Milestone:** 03
- **Fixture type:** synthetic
- **Private data:** none

## Fixture Manifest

The suite defines checksummed manifests for:

- `empty-install`
- `persisted-instance`
- `verified-legacy-instance-mapping`
- `restored-verified-backup`

Every fixture manifest records:

- source application version
- source schema version
- expected migration target
- SHA-256 checksum
- sanitization statement
- expected findings

The fixtures are synthetic and contain no user, provider, credential, or
private media data.

## Deterministic Empty Migration

The empty-install fixture proves:

- all registered ChannelForge migrations apply in deterministic order
- every migration reaches `APPLIED`
- rerunning applies nothing twice
- already-applied migrations are reported deterministically
- SQLite integrity passes

## Restore Rehearsal

The restore fixture:

1. Creates a filesystem-backed ChannelForge database.
2. Applies the full M03 migration registry.
3. Persists ChannelForge Instance identity.
4. Persists and verifies a Tunarr-to-ChannelForge legacy identity mapping.
5. Produces an online SQLite backup.
6. Verifies the backup.
7. Copies the quiescent verified backup artifact into a restore target.
8. Opens the restored database through the normal ChannelForge connection
   factory.
9. Re-runs migration discovery without duplicate application.
10. Verifies the original ChannelForge Instance ID.
11. Verifies the legacy mapping remains `VERIFIED`.
12. Runs SQLite quick-check and foreign-key-check.

The original live source database is never copied directly.

## Remaining Failure-Injection Work

The broader M03 completion audit still needs to classify or prove the remaining
roadmap failure cases that are not already covered by runner, backup, lease,
mapping, or transaction tests.

## Closeout Failure Injection

The M03 closeout suite additionally proves:

- checkpointed batch resume after database reopen
- injected crash before checkpoint rolls back target writes
- retry from the last committed checkpoint reaches one canonical result
- SQLite `SQLITE_FULL` rolls back the active transaction
- database integrity remains valid after the disk-full failure
- read-only write attempts are rejected as `SQLITE_READONLY`
- unknown applied schema migrations are rejected as unsupported schema-ahead

The dedicated `M03 Persistence` GitHub Actions workflow runs the persistence
suite on both Windows and Linux.
