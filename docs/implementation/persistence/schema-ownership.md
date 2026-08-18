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

No inherited table is deleted or rewritten by this schema unit.
