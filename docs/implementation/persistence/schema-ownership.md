# ChannelForge Schema Ownership

- **Milestone:** 03
- **Status:** In Progress
- **Schema prefix:** `cf_`

The `cf_` prefix identifies ChannelForge-owned tables while inherited Tunarr
tables remain present.

| Table | Owning boundary | Authoritative | Mutable | Migration owner | Retention |
| --- | --- | --- | --- | --- | --- |
| `cf_schema_migration` | Persistence infrastructure | Yes, for ChannelForge schema history | Status only | Migration | Application lifetime |
| `cf_migration_run` | Migration | Yes, for controlled migration runs | Yes | Migration | Migration history |
| `cf_migration_step` | Migration | Yes, for run-step execution state | Yes | Migration | Migration history |
| `cf_migration_checkpoint` | Migration | Yes, for restart position | Yes | Migration | Migration history |
| `cf_migration_conflict` | Migration | Yes, for migration conflict state | Yes | Migration | Migration history |

## Authority Boundary

These tables are authoritative only for ChannelForge migration infrastructure.

They do not become authoritative for inherited Tunarr Channel, Program, Media
Source, scheduling, or runtime state.

No inherited table is deleted or rewritten by these schema units.

## Instance Persistence

| Table | Owning boundary | Authoritative | Mutable | Migration owner | Retention |
| --- | --- | --- | --- | --- | --- |
| `cf_instance` | Instance | Yes, for ChannelForge Instance identity | Yes, optimistic versioning | Migration | Application lifetime |

`cf_instance` remains distinct from inherited Tunarr installation/settings
identity until compatibility cutover is explicitly approved.

## Backup and Integrity

| Table | Owning boundary | Authoritative | Mutable | Migration owner | Retention |
| --- | --- | --- | --- | --- | --- |
| `cf_backup_record` | Persistence / Migration | Yes, for ChannelForge backup evidence | Lifecycle status | Migration | Rollback and retention policy |
| `cf_integrity_check` | Persistence / Migration | Yes, for integrity evidence | No after insertion | Migration | Migration and operational evidence |

These records protect later migrations but do not transfer authority from any
inherited Tunarr domain table.

## Legacy Identity Mapping

| Table | Owning boundary | Authoritative | Mutable | Migration owner | Retention |
| --- | --- | --- | --- | --- | --- |
| `cf_legacy_identity_mapping` | Migration / Compatibility | Yes, for recorded legacy-to-ChannelForge identity relationships | Lifecycle status only | Migration | Migration and compatibility history |

Legacy mappings do not make inherited or provider identifiers canonical
ChannelForge identity.

Migration `0004_legacy_identity_mapping` initially enforces one-to-one
cardinality.

## Operational Safety

| Table | Owning boundary | Authoritative | Mutable | Migration owner | Retention |
| --- | --- | --- | --- | --- | --- |
| `cf_audit_record` | Persistence infrastructure | Yes, for ChannelForge audit evidence | Append only | Migration | Operational/audit policy |
| `cf_idempotency_record` | Persistence infrastructure | Yes, for command idempotency state | Controlled status transition | Migration | Idempotency retention policy |
| `cf_migration_lease` | Persistence / Migration | Yes, for active migration lease ownership | Lease lifecycle | Migration | Active lease only |

These tables do not transfer authority from inherited Tunarr domain tables.
