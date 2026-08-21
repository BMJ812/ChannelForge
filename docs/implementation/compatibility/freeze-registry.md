# Freeze Registry

## Purpose

PR 04N establishes the server-side infrastructure used to freeze inherited
Tunarr mutation paths before cutover.

Freeze enforcement is a server responsibility. UI hiding or disabled controls
are not enforcement.

PR 04N does **not** activate a broad freeze.

## Registry

| Write path | Concept | Enforcement point | Replacement | Validation | Rollback | State |
| --- | --- | --- | --- | --- | --- | --- |
| `legacy-management-routes` | legacy-management | server-side route mutation boundary | pending | replacement route/command verified before freeze | restore route write permission | ACTIVE |
| `legacy-jobs` | background-jobs | compatibility legacy-job execution boundary | ChannelForge compatibility job handler | replacement handler verified and legacy write usage measured | restore job execution permission | ACTIVE |
| `legacy-direct-database-writers` | persistence | legacy persistence mutation boundary | pending | canonical repository path verified | restore direct legacy writer permission | ACTIVE |
| `legacy-schedule-writers` | scheduling | legacy schedule mutation boundary | ChannelForge approved schedule plan path | canonical schedule authority and output verified | restore legacy schedule writer permission | ACTIVE |
| `legacy-provider-sync-writers` | media-sources | legacy provider synchronization mutation boundary | pending | provider compatibility replacement verified | restore provider sync writer permission | ACTIVE |
| `legacy-output-generators` | output | legacy generated-artifact mutation boundary | ChannelForge output artifact path | canonical and last-valid output verified | restore legacy output generator permission | ACTIVE |
| `legacy-settings-writers` | settings | legacy settings mutation boundary | pending | replacement settings command verified | restore legacy settings writer permission | ACTIVE |
| `legacy-cleanup-jobs` | cleanup | legacy cleanup mutation boundary | pending | cleanup ownership and retention behavior verified | restore legacy cleanup writer permission | ACTIVE |

All entries are `ACTIVE` in PR 04N.

## Guard Behavior

A registered `ACTIVE` path is allowed.

A registered `FROZEN` path is denied with stable error:

```text
LEGACY_WRITE_FROZEN
```

A frozen attempt increments the existing bounded metric:

```text
FROZEN_WRITE_ATTEMPTS
```

Unknown write paths fail closed with `COMPATIBILITY_UNAVAILABLE`.

The guard does not execute writes itself.

## Legacy Jobs

PR 04N connects the guard to the PR 04M compatibility job handler.

For jobs classified `LEGACY_WRITE`, the `legacy-jobs` guard runs before:

- input translation;
- execution; and
- retryable compatibility action behavior.

When frozen, the handler returns `SKIPPED` and performs no mutation.

Non-writing jobs are not blocked by the `legacy-jobs` write freeze.

This is infrastructure only. The default registry remains active.

## Job Freeze Semantics

The roadmap requires legacy job freeze to apply server-side to enqueue, start,
retry, and reschedule behavior. PR 04N establishes the reusable guard and the
job-handler start boundary. Later wiring must use the same guard at the
remaining concrete scheduler/enqueue boundaries before a broad freeze is
activated.

## Rollback

Rollback is explicit: restore the affected registry entry to `ACTIVE`.

Rollback does not require a schema migration or data rewrite.

Tests prove a frozen job does not execute and that restoring the entry to
`ACTIVE` permits execution again.

## Runtime Impact

```text
Broad freeze activation:       none
Default registry state:        ACTIVE
Production route wiring:       unchanged
Production scheduler wiring:   unchanged
Persistence migration:         none
Provider calls:                none
UI enforcement dependency:     none
```

## Next Unit

PR 04O performs the first low-risk legacy writer freeze after its replacement
is verified.
