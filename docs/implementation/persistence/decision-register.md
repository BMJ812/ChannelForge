# ChannelForge M03 Persistence Decision Register

| Decision | M03 choice | Rationale |
| --- | --- | --- |
| Version 1 database | SQLite | Single-instance home-server target; no distributed database requirement |
| Canonical ChannelForge IDs | UUIDv4 lowercase text | Opaque, stable, mature support, no embedded creation time |
| SQLite ID storage | `TEXT` | Portable and inspectable canonical representation |
| Journal mode | WAL by default; DELETE explicit fallback | Concurrent reads with documented storage fallback |
| Busy timeout | Bounded, 5000 ms default | Avoid unbounded lock waits |
| Write transaction mode | Immediate | Predictable write-lock acquisition |
| Nested transactions | Rejected | Prevent hidden long-lived write scopes |
| Connection count | Explicit bounded manager | Prevent unbounded connection creation in composition root |
| Legacy namespace | `tunarr` | Durable compatibility provenance |
| Initial legacy mapping cardinality | One-to-one | Conservative identity proof before split/merge requirements exist |
| Legacy identifier handling | Opaque; validate blank without trimming value | Preserve inherited identity exactly |
| External identifiers | Qualified by Media Source, provider, entity type, and value | Provider IDs never become ChannelForge canonical IDs |
| Backup | SQLite online backup + checksum + independent reopen | Avoid unsafe live raw file copies |
| Migration exclusivity | Durable SQLite lease | Cross-connection single migration owner |
| Idempotency | Scope + actor + key + request SHA-256 | Replay exact requests; reject key collisions |
| Compatibility read proof | Verified mapping with legacy fallback | Demonstrate cutover path without changing runtime authority |
| Unsupported downgrade | Fail on unknown applied migration | Older application must not silently accept newer schema |
| M03 runtime authority | No inherited write-authority cutover | Preserve rollback and compatibility boundary |
