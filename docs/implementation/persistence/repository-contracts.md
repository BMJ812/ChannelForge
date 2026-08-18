# ChannelForge Repository Contracts

- **Milestone:** 03
- **Representative aggregate:** Instance

Repository interfaces belong to their owning module.

The concrete SQLite implementation remains infrastructure.

The initial Instance repository proves:

- Insert
- Read
- Stable branded identity
- Single-Instance enforcement
- Optimistic version update
- Stale-version rejection
- Constraint translation
- Transaction rollback
- Persistence across database reopen

Raw SQLite records are not exported through the module boundary.

The existing inherited Instance identity reader remains separate until an
explicit compatibility cutover is approved.
