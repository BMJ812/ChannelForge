# Tunarr Compatibility Boundary

This namespace is the temporary anti-corruption boundary between inherited
Tunarr implementation and ChannelForge-owned concepts.

## Rules

- Compatibility adapters may depend on inherited Tunarr implementation.
- New ChannelForge code must use declared compatibility ports.
- Persistence records and inherited DTOs must not escape through ports.
- Compatibility use must remain measurable and removable.
- Legacy identifiers never become ChannelForge canonical identifiers.
- One write authority exists per concept per phase.
- Compatibility contracts do not themselves change runtime authority.

## Public Core Contracts

Milestone 04 begins with contracts under `ports/` for:

- Compatibility mode
- Compatibility read result
- Compatibility write status
- Stable compatibility error descriptors
- Compatibility metrics

Business modules may consume these contracts only through the governed
compatibility port entry point.

The contracts intentionally contain no inherited Tunarr database rows, query
builders, route DTOs, provider payloads, settings objects, or process
singletons.

## Current Adapters

`TunarrInstanceIdentityAdapter` translates the inherited SettingsDB `clientId`
read into the ChannelForge concept `instanceId`.

`MappedTunarrInstanceIdentityReader` is an M03 proof path that can resolve a
verified mapping to the persisted ChannelForge Instance ID. It is not wired as
the inherited runtime authority.

`TunarrMediaSourceSynchronizationAdapter` translates ChannelForge Media Sources
synchronization requests into the inherited media-source scan coordinator
without exposing legacy scanner or database types.

## Usage Evidence

Existing compatibility activity is measured with process-local counters.

- `instance-identity-read` records inherited instance identity reads.
- `media-source-synchronization-request` records synchronization requests
  delegated to the inherited scan coordinator.

The M04 `CompatibilityMetrics` port establishes the bounded operational metrics
contract for later compatibility reads, routes, writes, reconciliation, freeze,
and output work.

Existing process-local counters remain unchanged in PR 04A.

## PR 04A Authority

```text
Runtime read authority:    unchanged
Runtime write authority:   unchanged
Compatibility route set:   unchanged
Legacy jobs:               unchanged
Legacy tables:             unchanged
Production cutover:        none
```

## Legacy Identity Resolver

PR 04B adds a generic resolver under `identity/`.

Resolution is:

```text
tombstone
  -> verified mapping
  -> conflict / unmapped
```

A tombstone blocks automatic rematerialization.

Only `VERIFIED` mappings resolve to ChannelForge identity.

Conflict state returns durable conflict identity and never selects an arbitrary
candidate.

The resolver is not wired into inherited production read authority by PR 04B.

## First Production Compatibility Read

PR 04C moves `POST /jellyfin/login` to a canonical-first Instance identity read.

The reader reuses the inherited process SQLite connection and performs no schema
or identity writes.

Canonical identity is returned only when persisted Instance identity and a
VERIFIED `tunarr` mapping agree exactly.

All other states remain explicit legacy fallback during this support phase.

No other route is cut over in PR 04C.

## Lazy Instance Identity Mapping

PR 04D permits `POST /jellyfin/login` to lazily create the singleton Instance
identity mapping only under the explicit
`JELLYFIN_LOGIN_INSTANCE_IDENTITY` policy.

The write is:

- immediate-transaction protected
- idempotent
- audited
- tombstone-aware
- uniqueness constrained
- restricted to an already-existing ChannelForge Instance

No ChannelForge entity is created by the compatibility read.

No inherited domain write authority changes.

## Shadow Read Framework

PR 04E adds a reusable `DUAL_COMPARE` framework under `shadow/`.

The framework:

- requires explicit legacy or canonical authority
- compares deterministic checksums
- classifies the exact M04 difference vocabulary
- supports deterministic sampling
- prohibits sampling for critical identity validation
- accepts cancellation
- records typed compatibility metrics
- retains only bounded diagnostic findings
- never retains compared payloads
- never changes authority

PR 04E does not enable a new production shadow policy.

## Legacy Route Registry

PR 04F adds `routes/` as the explicit application-host registration boundary
for inherited Tunarr API and streaming routers.

The registry records finite method/template pairs, compatibility
classification, registration group, mode, tags, and usage metrics.

Visible inherited routes receive `legacy` and `compatibility` OpenAPI tags.
Hidden routes stay hidden.

The host no longer imports the HDHomeRun, API, video, or stream routers
directly.

PR 04F does not adapt a route handler and does not change read or write
authority.
