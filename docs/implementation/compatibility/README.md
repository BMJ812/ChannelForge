# ChannelForge Legacy Compatibility

- **Milestone:** 04 â€” Legacy Compatibility
- **Current unit:** PR 04B â€” Legacy Identity Resolver
- **Runtime cutover:** none
- **Legacy authority change:** none

## Purpose

This directory records the controlled coexistence contract between
ChannelForge-owned concepts and inherited Tunarr behavior.

Compatibility is an anti-corruption layer.

It preserves user intent while preventing inherited database rows, route DTOs,
provider payloads, scheduling classes, output internals, and identifiers from
becoming new ChannelForge domain contracts.

## Boundary

The runtime boundary is:

```text
server/src/compatibility/tunarr/
```

New ChannelForge modules may depend only on declared compatibility ports.

Compatibility implementations may depend on inherited Tunarr implementation
when translation requires it.

## Core Modes

The accepted modes are:

- `LEGACY_ONLY`
- `LEGACY_READ_CANONICAL_WRITE`
- `CANONICAL_READ_LEGACY_FALLBACK`
- `CANONICAL_ONLY`
- `DUAL_COMPARE`
- `TEMPORARY_WRITE_TRANSLATION`
- `FROZEN_LEGACY_WRITE`
- `RETIRED`

See `mode-registry.md` for current runtime classification.

## Read Contract

A compatibility read returns one of:

```text
CANONICAL
LEGACY_FALLBACK
CONFLICT
NOT_FOUND
```

A legacy fallback carries warning codes.

A conflict carries durable conflict identity.

Compatibility metadata is internal diagnostic information and is not exposed
through ordinary public APIs by default.

## Write Status Contract

Compatibility write state is:

```text
CURRENT
PENDING
DEGRADED
FAILED
CONFLICT
FROZEN
RETIRED
```

`DEGRADED` explicitly represents a state that requires reconciliation.

`FROZEN` uses the stable error code `LEGACY_WRITE_FROZEN`.

The contract does not authorize dual independent writers.

## Errors

Compatibility errors use stable descriptors instead of exposing raw inherited
exceptions.

Initial error codes are:

```text
COMPATIBILITY_UNAVAILABLE
COMPATIBILITY_TRANSLATION_FAILED
COMPATIBILITY_CONFLICT
LEGACY_WRITE_FROZEN
```

Raw SQL, stack traces, provider credentials, signed URLs, authorization
headers, private media paths, and process commands are not compatibility error
contract fields.

## Metrics

`CompatibilityMetrics` supports typed counters, gauges, and latency
observations.

Bounded dimensions are:

- Concept
- Entity type
- Route template
- Operation
- Compatibility mode
- Result
- Application version
- Source schema version

Raw legacy IDs and ChannelForge IDs are not metric dimensions.

## Existing M03 Foundation

Milestone 03 already provides:

- Canonical ChannelForge identifiers
- Durable `tunarr` legacy identity mappings
- Durable migration conflicts
- Verified backup and integrity preflight
- Transaction coordination
- Audit and idempotency foundations
- A proof-only mapped Instance identity read
- Observable proof-only shadow findings

PR 04A does not convert those proofs into production cutover.

## Entry Evidence

M04 entry is supported by:

- Baseline API inventory
- Baseline background-runtime inventory
- Established module boundaries
- Completed M03 persistence and mapping foundation
- Passing Windows and Linux persistence CI

Route and job inventories are expanded in their dedicated M04 units before
route or writer cutover.

## Removal Policy

Compatibility code is temporary.

Removal requires:

- Replacement behavior exists
- First-party callers are migrated
- Supported external callers are accounted for
- Usage evidence is trustworthy
- Support window is complete
- Rollback window is closed
- Historical fixtures remain
- Release guidance exists
- Explicit removal approval exists

## PR 04A Change-Control Record

| Field | PR 04A |
| --- | --- |
| Legacy path | Inherited Tunarr subsystem; no path replaced |
| Target module | Compatibility public ports |
| Compatibility mode | Existing runtime classifications remain `LEGACY_ONLY` |
| Read authority | Unchanged |
| Write authority | Unchanged |
| Mapping namespace | `tunarr` |
| Fallback | No new runtime fallback |
| Partial failure | No new mutation path |
| Reconciliation | Contract only; no job invoked |
| Metrics | Interface established; no runtime metric cutover |
| Freeze gate | Not activated |
| Removal gate | M04 removal-readiness evidence |
| Rollback | Remove contracts/docs; existing adapters continue unchanged |
| Tests | Core contracts + existing compatibility regressions |

## PR 04B Change-Control Record

| Field | PR 04B |
| --- | --- |
| Legacy path | Qualified inherited identity references |
| Target module | Compatibility identity resolver + Migration-owned identity state |
| Compatibility mode | No runtime transition |
| Read authority | Unchanged |
| Write authority | Unchanged |
| Mapping namespace | `tunarr` |
| Fallback | Resolver returns controlled unmapped state; no new runtime fallback |
| Tombstone | Durable lookup precedes mapping |
| Conflict | Durable conflict ID returned; no arbitrary target selection |
| Partial failure | Conflict mapping missing durable conflict ID fails safely |
| Reconciliation | No reconciliation job invoked |
| Metrics | Mapping/tombstone lookup, conflict, unmapped, error, latency |
| Freeze gate | Not activated |
| Removal gate | Resolver removable only after legacy identity paths retire |
| Rollback | Stop resolver use; preserve additive tombstone history |
| Tests | SQLite tombstone persistence + resolver integration + existing regressions |
