# ChannelForge Transaction Policy

- **Milestone:** 03
- **Status:** Initial implementation

ChannelForge write transactions are coordinated explicitly.

The initial SQLite coordinator:

- Uses `BEGIN IMMEDIATE` semantics through Better SQLite3
- Commits successful operations
- Rolls back thrown failures
- Prohibits hidden nested transactions
- Does not expose provider clients
- Does not execute FFmpeg

Transactions remain synchronous and short.

External network work and process execution occur outside write transactions.

Savepoints are deferred until a concrete composition requirement exists.
