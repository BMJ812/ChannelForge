# ChannelForge SQLite Connection Initialization

- **Milestone:** 03
- **Status:** Initial implementation
- **Runtime cutover:** No

## Initial Connection Policy

The ChannelForge SQLite connection factory currently:

- Enables `PRAGMA foreign_keys = ON`
- Verifies foreign-key enforcement
- Requests and verifies WAL journal mode by default
- Configures a bounded busy timeout
- Defaults the busy timeout to 5000 milliseconds
- Closes the connection when initialization fails

## WAL

WAL is the initial preferred development and local-storage policy.

Deployment validation on Docker and Unraid remains required before this policy
is treated as universally supported storage behavior.

The connection factory also accepts explicit `delete` journal mode so later
deployment policy can choose a validated fallback without changing repository
contracts.

## Runtime Authority

This connection factory is not yet wired into the inherited Tunarr application
bootstrap.

No existing Tunarr database connection, schema, migration runner, or write
authority changes in this unit.

The first ChannelForge-owned schema will be introduced by the next additive
migration unit.
