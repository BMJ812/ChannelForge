# Milestone 03 Completion Report

- **Milestone:** 03 â€” Identity, Persistence, and Migrations
- **Status:** Complete on merge of the M03 completion-gates pull request
- **Active migration registry:** `0001` through `0005`
- **Database:** SQLite
- **Compatibility runtime authority:** inherited Tunarr remains authoritative
- **Milestone 04 entry:** approved by merge of this completion-gates pull request

## Completion Gate Audit

| # | Gate | Evidence |
| --- | --- | --- |
| 1 | Identifier format accepted | UUIDv4 decision |
| 2 | Identifier parsing exists | Shared identifier codec |
| 3 | Identifier generation exists | Shared identifier codec |
| 4 | Initial module-owned branded IDs exist | Instance, Media Sources, Catalog, Networks, Channels, migration operational IDs |
| 5 | External identifiers are qualified | `QualifiedExternalId` |
| 6 | Legacy mapping schema exists | `cf_legacy_identity_mapping` |
| 7 | Mapping uniqueness enforced | SQLite source and target uniqueness |
| 8 | Mapping conflicts durable | `cf_migration_conflict` repository + close/reopen proof |
| 9 | Revision identity policy exists | revision/concurrency policy |
| 10 | Canonical serialization policy exists | revision/concurrency policy |
| 11 | Optimistic concurrency policy exists | integer version + stale update proof |
| 12 | Representative versioned aggregate works | `cf_instance` |
| 13 | SQLite initialization exists | connection factory |
| 14 | Foreign keys enabled and verified | connection initialization + tests |
| 15 | Busy timeout configured | bounded 5000 ms default |
| 16 | Journal policy implemented | WAL default, DELETE fallback |
| 17 | Connection count bounded | connection manager limit |
| 18 | Transaction coordinator exists | SQLite immediate coordinator |
| 19 | Nested transaction policy enforced | nested call rejection |
| 20 | External calls excluded from write transactions | transaction API/policy |
| 21 | FFmpeg excluded from write transactions | transaction API/policy |
| 22 | Repository interfaces module-owned | Instance and migration ports |
| 23 | Representative SQLite repository passes contract cases | Instance repository tests |
| 24 | Query ordering policy enforced | explicit stable ordering + tests |
| 25 | Schema migration metadata exists | `cf_schema_migration` |
| 26 | Applied migration checksum verified | runner checksum guard |
| 27 | Migration exclusivity exists | durable lease |
| 28 | Failed migration durable | FAILED ledger proof |
| 29 | Incomplete migration detected on restart | RUNNING retry proof |
| 30 | Migration checkpoint exists | `cf_migration_checkpoint` |
| 31 | Batch resume tested | checkpointed reopen/crash/retry proof |
| 32 | Conflict state exists | `cf_migration_conflict` |
| 33 | Backup preflight exists | composed preflight |
| 34 | Backup verification exists | checksum + independent reopen |
| 35 | Restore rehearsal passes | synthetic restore fixture |
| 36 | Integrity checks exist | quick-check + FK check |
| 37 | Audit foundation exists | `cf_audit_record` |
| 38 | Idempotency foundation exists | `cf_idempotency_record` |
| 39 | Compatibility read uses mappings | mapped Instance identity proof |
| 40 | Shadow comparison observable | shadow metrics/finding snapshot |
| 41 | No legacy table deleted | additive-only M03 changes |
| 42 | Unsupported downgrade prevented | unknown APPLIED migration rejection |
| 43 | Windows persistence tests pass | dedicated M03 CI + local Windows validation |
| 44 | Linux persistence tests pass | dedicated M03 CI |
| 45 | Failure injection passes | migration failure, corruption, lease, batch crash, disk full, read-only |
| 46 | Disk-full behavior tested or recorded | `SQLITE_FULL` rollback/integrity proof |
| 47 | Permission failure behavior tested | read-only write-denial proof |
| 48 | Migration fixture suite exists | synthetic fixture manifests and tests |
| 49 | Schema ownership registry exists | `schema-ownership.md` |
| 50 | Write-authority matrix exists | `write-authority.md` |
| 51 | Transaction policy exists | `transaction-policy.md` |
| 52 | Migration state machine exists | `migration-state-machine.md` |
| 53 | Backup and restore documentation exists | `backup-and-restore.md` |
| 54 | Completion report exists | this document |
| 55 | Milestone 04 entry approved | merge of completion-gates PR |

## Applied Migration Set

```text
0001_migration_metadata
0002_instance_identity
0003_backup_integrity
0004_legacy_identity_mapping
0005_operational_safety
```

Applied migration source is checksum-protected.

A database with an unknown applied migration is rejected rather than silently
opened by an older migration registry.

## Identifier Decision

Canonical ChannelForge identity is lowercase UUIDv4 text stored as SQLite
`TEXT`.

Provider IDs and Tunarr IDs remain qualified external or legacy references.

They do not become ChannelForge canonical identity.

## Persistence Evidence

The representative Instance aggregate proves:

- generated stable ID
- insert/read
- singleton enforcement
- optimistic concurrency
- stale update rejection
- transaction rollback
- close/reopen persistence

## Migration Evidence

M03 proves:

- ordered migrations
- checksums
- durable failure
- restart-safe schema retry
- migration exclusivity
- durable conflicts
- checkpoint persistence
- checkpointed batch resume
- verified backup preflight
- restore rehearsal
- schema-ahead rejection

## Failure Injection Evidence

Verified cases include:

- invalid DDL rollback
- interrupted RUNNING schema migration retry
- corrupt foreign-key source
- backup/preflight failure
- stale migration lease takeover
- checkpointed batch crash before checkpoint
- SQLite disk full
- SQLite read-only write denial
- mapping conflict
- unknown future applied schema

## Compatibility Evidence

The Instance identity compatibility proof can resolve:

```text
tunarr / instance / <legacy ID>
    ->
instance / <ChannelForge InstanceId>
```

only through a `VERIFIED` mapping.

Missing, unverified, or mismatched mapping state deterministically falls back to
the inherited identity and records an observable shadow finding.

The proof is not wired into inherited production startup.

## Authority and Rollback

No inherited Tunarr domain table is deleted.

No inherited write authority is transferred in M03.

M03 rollback remains:

- revert application code
- preserve ChannelForge IDs and mappings already referenced
- leave additive `cf_` tables in place where harmless
- restore a verified backup when recovery requires it
- continue using inherited compatibility reads until a later explicit cutover

## Deferred to Later Milestones

The following are intentionally outside M03 completion:

- production compatibility-read cutover
- legacy write freeze
- domain-specific Network/Channel/Catalog schema migration
- managed-media file authority
- runtime observability dashboards
- full provider migration
- legacy table retirement
