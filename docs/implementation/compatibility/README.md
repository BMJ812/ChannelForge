# ChannelForge Legacy Compatibility

- **Milestone:** 04 Ã¢â‚¬â€ Legacy Compatibility
- **Current unit:** PR 04I - Reconciliation Framework
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

## PR 04C Change-Control Record

| Field | PR 04C |
| --- | --- |
| Legacy path | Jellyfin login device identity |
| Target module | Compatibility Instance identity read |
| Compatibility mode | `CANONICAL_READ_LEGACY_FALLBACK` |
| Read authority | Canonical when verified mapping and persisted Instance agree; legacy fallback otherwise |
| Write authority | Unchanged |
| Mapping namespace | `tunarr` |
| Fallback | Inherited SettingsDB client ID |
| Tombstone | Blocks canonical resolution; legacy fallback remains during support phase |
| Conflict | Blocks canonical resolution; no candidate selected |
| Partial failure | Canonical read error becomes explicit legacy fallback + compatibility error metric |
| Reconciliation | None |
| Metrics | Canonical read, fallback, mapping/tombstone, shadow, error, latency |
| Freeze gate | Not activated |
| Removal gate | Jellyfin fallback removable only after mapping coverage and support window |
| Rollback | Restore legacy adapter at route; no data rollback |
| Tests | Canonical hit, schema fallback, unverified mapping, tombstone, mismatch, existing compatibility regressions |

## PR 04D Change-Control Record

| Field | PR 04D |
| --- | --- |
| Legacy path | Jellyfin login Instance identity with no existing mapping |
| Target module | Compatibility lazy identity mapping |
| Compatibility mode | `CANONICAL_READ_LEGACY_FALLBACK` unchanged |
| Read authority | Canonical after safe mapping creation/verification; legacy fallback otherwise |
| Write authority | Inherited domain write authority unchanged; Migration owns mapping metadata |
| Mapping namespace | `tunarr` |
| Lazy policy | `JELLYFIN_LOGIN_INSTANCE_IDENTITY` only |
| Fallback | Inherited SettingsDB client ID |
| Partial failure | Transaction rollback + bounded warning + legacy fallback |
| Conflict | Preserve existing mapping, durable failure audit, no arbitrary target |
| Reconciliation | None queued by 04D |
| Metrics | Mapping creation, lazy mapping, conflict, canonical/fallback, errors |
| Freeze gate | Not activated |
| Removal gate | Lazy policy removable after mapping coverage is complete |
| Rollback | Disable lazy policy; retain verified mapping history |
| Tests | eligibility, idempotency, audit, tombstone, competing proposal, reader integration |

## PR 04E Change-Control Record

| Field | PR 04E |
| --- | --- |
| Legacy path | Reusable legacy/canonical read comparison; no route enabled |
| Target module | Compatibility shadow-read framework |
| Compatibility mode | `DUAL_COMPARE` framework vocabulary; no runtime concept changes mode |
| Read authority | Caller-designated and unchanged by comparison |
| Write authority | Unchanged |
| Mapping namespace | Concept-specific; none created by framework |
| Fallback | Framework does not choose fallback |
| Partial failure | Bounded `UNKNOWN` finding or controlled skip; authority unchanged |
| Reconciliation | No durable reconciliation finding created by 04E |
| Metrics | Shadow comparisons, mismatches, latency |
| Sampling | Deterministic; prohibited for critical identity validation |
| Diagnostics | Bounded checksums/classification only; no raw payload retention |
| Freeze gate | Not activated |
| Removal gate | Framework removable after all shadow policies retire |
| Rollback | Remove framework use/exports; no data rollback |
| Tests | authority, checksums, classes, sampling, cancellation, bounds, diagnostics |

## PR 04F Change-Control Record

| Field | PR 04F |
| --- | --- |
| Legacy path | Inherited API, HDHomeRun, video, and stream route registration |
| Target module | Compatibility route registry and host registration wrappers |
| Compatibility mode | Route-specific; no route changes mode in 04F |
| Read authority | Unchanged |
| Write authority | Unchanged |
| Mapping namespace | Unchanged |
| Fallback | Unchanged |
| Partial failure | Registry/metric instrumentation never substitutes handler output |
| Reconciliation | None |
| Metrics | Legacy route calls, deprecated route calls when classified, latency |
| Tags | `legacy` + `compatibility`; `deprecated` only when applicable |
| Freeze gate | Not activated |
| Removal gate | Recorded per route |
| Rollback | Restore direct host registrations; no data rollback |
| Tests | classification, route mode, tags, metrics, registration isolation |

## PR 04G Change-Control Record

| Field | PR 04G |
| --- | --- |
| Legacy path | `GET /api/settings/media-source` and `PUT /api/settings/media-source` |
| Target module | Media Sources scan-policy application service |
| Classification | `ADAPT_READ` and `ADAPT_WRITE` |
| Compatibility mode | `LEGACY_ONLY` unchanged |
| Read authority | Inherited Tunarr settings through a ChannelForge-owned store port |
| Write authority | Inherited Tunarr settings; one legacy writer remains |
| Mapping namespace | None; this contract contains no entity identifier |
| Fallback | None introduced |
| Request translation | `rescanIntervalHours` -> canonical `intervalHours` |
| Response translation | canonical `intervalHours` -> legacy `rescanIntervalHours` |
| Partial failure | Canonical validation fails before inherited persistence; inherited write failure propagates without a second writer |
| Reconciliation | None; no dual or canonical persistence exists in 04G |
| Metrics | Existing legacy route call and compatibility latency metrics |
| Deprecation metadata | Recorded with replacement, support window, behavior/error differences, migration guidance, and removal gate; route is not yet marked deprecated |
| Freeze gate | Not activated |
| Removal gate | Publish replacement management route, migrate first-party caller, zero supported use, support/rollback windows complete |
| Rollback | Restore direct settings handlers; no data rollback |
| Tests | canonical service, translation, read adapter, write adapter, validation, route registry |

## PR 04H Change-Control Record

| Field | PR 04H |
| --- | --- |
| Legacy path | Reusable temporary write-translation framework; no production route activated |
| Target module | Compatibility write coordinator + durable status persistence |
| Compatibility mode | `TEMPORARY_WRITE_TRANSLATION` framework only; no runtime concept transitions |
| Read authority | Unchanged |
| Write authority | Unchanged in production; future use requires one ChannelForge command authority |
| Mapping namespace | Concept-specific; no mapping created by 04H |
| Fallback | None |
| Partial failure | Explicit `FAILED` or `DEGRADED`; post-commit compatibility failure is never uncomplicated success |
| Status persistence | `cf_compatibility_status` via migration `0007_compatibility_status` |
| Reconciliation | Enqueue port only; PR 04I owns execution and findings |
| Metrics | Legacy write attempts, translation success/failure, compatibility errors, queue depth, latency |
| Freeze gate | Not activated |
| Removal gate | Remove after temporary write translations retire and required history is retained |
| Rollback | Stop coordinator use; preserve additive status history |
| Tests | SQLite reopen/concurrency, success, authoritative failure, projection failure, enqueue failure, status failure, bounded metrics |

## PR 04I Change-Control Record

| Field | PR 04I |
| --- | --- |
| Legacy path | Durable recovery for compatibility representation divergence; no production worker activated |
| Target module | Compatibility reconciliation runner + Migration-owned reconciliation persistence |
| Compatibility mode | Framework uses existing temporary-write reconciliation vocabulary; no runtime concept transitions |
| Read authority | Unchanged |
| Write authority | Unchanged; canonical state cannot be overwritten from legacy by ordinary reconciliation |
| Mapping namespace | Concept-specific; framework creates no mapping |
| Fallback | None introduced |
| Partial failure | Retryable worker failure is bounded and durable; attempt ceiling becomes explicit `FAILED` |
| Persistence | `cf_compatibility_reconciliation_job` + `cf_compatibility_reconciliation_finding` via migration `0008_compatibility_reconciliation` |
| Restart | Interrupted `RUNNING` jobs return to `QUEUED` with checkpoint/progress retained |
| Batch | One bounded batch per runner invocation; default 100, maximum 500 |
| Findings | Durable severity/outcome/status with idempotent per-job finding key |
| Operator visibility | Read-only bounded job/finding diagnostics |
| Metrics | Compared, equal, repaired, conflicts, failed, retries, queue depth, oldest finding age, duration |
| Freeze gate | Not activated |
| Removal gate | Remove after all reconciliation producers/workers retire and required history is retained |
| Rollback | Stop runner/diagnostics use; preserve additive reconciliation history |
| Tests | enqueue dedupe, persistence reopen, restart, checkpoint, findings, retry ceiling, cancellation boundary, metrics, diagnostics |
