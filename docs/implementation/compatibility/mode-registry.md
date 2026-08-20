# Compatibility Mode Registry

- **Milestone:** 04
- **Status:** Active
- **Default:** `LEGACY_ONLY` unless an explicit compatibility PR records a
  transition

## Mode Definitions

| Mode | Meaning |
| --- | --- |
| `LEGACY_ONLY` | Legacy state remains authoritative; ChannelForge may read through an adapter |
| `LEGACY_READ_CANONICAL_WRITE` | Canonical writes exist while legacy reads remain active |
| `CANONICAL_READ_LEGACY_FALLBACK` | Canonical read first; legacy read only when canonical state is absent |
| `CANONICAL_ONLY` | Runtime uses ChannelForge state only; legacy may remain for rollback/history |
| `DUAL_COMPARE` | Both states are read for comparison while one side remains authoritative |
| `TEMPORARY_WRITE_TRANSLATION` | One authoritative command produces a required compatibility representation |
| `FROZEN_LEGACY_WRITE` | Legacy mutation is rejected server-side |
| `RETIRED` | Compatibility path is removed from active runtime; historical fixtures remain |

## Current Runtime Registry

| Concept | Current mode | Read authority | Write authority | Fallback | Cutover gate | Removal milestone |
| --- | --- | --- | --- | --- | --- | --- |
| Instance identity â€” Jellyfin login | `CANONICAL_READ_LEGACY_FALLBACK` | Persisted ChannelForge Instance when a VERIFIED `tunarr` mapping agrees; approved 04D policy may lazily create/verify the singleton mapping | Inherited Tunarr path | Explicit inherited client-ID fallback with bounded warning | Mapping coverage + runtime fallback evidence before broader adoption | Later compatibility removal |
| Instance identity â€” M03 mapping proof | `DUAL_COMPARE` diagnostic proof only | Inherited Tunarr remains authoritative | No writer introduced | Legacy result on missing/unverified/mismatched mapping | Separate production-read PR | Later compatibility removal |
| Media Source synchronization delegation | `LEGACY_ONLY` | Inherited synchronization behavior | Inherited scan coordinator | None | Canonical Media Source synchronization implementation | Later compatibility removal |
| Legacy management routes | `LEGACY_ONLY` | Inherited handlers | Inherited handlers | Existing behavior | Route inventory + adapter proof | Later compatibility removal |
| Legacy background jobs | `LEGACY_ONLY` | Inherited runtime | Inherited runtime | Existing behavior | Job inventory + compatibility handler | Later compatibility removal |
| Scheduling runtime | `LEGACY_ONLY` | Inherited scheduler | Inherited scheduler | Existing behavior | M04 scheduling containment + M07 replacement | Later compatibility removal |
| Output protocols | `LEGACY_ONLY` | Inherited output behavior | Inherited generators/settings | Existing behavior | Protocol compatibility proof | Later compatibility removal |

## Transition Rule

A mode changes only in an explicit compatibility PR.

That PR must record:

- Previous mode
- New mode
- Read authority
- Write authority
- Mapping behavior
- Metrics
- Validation
- Rollback point
- Freeze gate when applicable
- Removal gate

A proof-only adapter or test does not silently change production mode.

## PR 04A

PR 04A establishes the mode vocabulary and registry.

It performs no runtime mode transition.

## PR 04C

PR 04C transitions only Jellyfin login Instance identity from `LEGACY_ONLY` to
`CANONICAL_READ_LEGACY_FALLBACK`.

Canonical use requires:

- persisted ChannelForge Instance
- VERIFIED `tunarr` mapping
- mapping target type `instance`
- exact target ID match
- no tombstone

Write authority remains inherited.

No lazy mapping or schema mutation is performed by the read path.

## PR 04D

PR 04D keeps Jellyfin login in
`CANONICAL_READ_LEGACY_FALLBACK`.

It adds one explicit lazy-mapping policy:

```text
JELLYFIN_LOGIN_INSTANCE_IDENTITY
```

The policy may create and verify only the installation-level
`tunarr / instance / <legacy client ID>` mapping to an already-existing
persisted ChannelForge Instance.

Write authority for inherited application state does not change.

## PR 04E

PR 04E adds the reusable `DUAL_COMPARE` shadow-read framework.

It performs no runtime mode transition.

Every future shadow policy must designate one authoritative side explicitly.
Comparison results, sampling, or diagnostics may not create dual read or write
authority.

Critical identity validation may not use partial sampling.

## PR 04F

PR 04F isolates inherited route registration under the compatibility boundary
and adds classification, tags, and usage measurement.

It performs no route mode transition.

The Jellyfin login route remains `CANONICAL_READ_LEGACY_FALLBACK`.

Other inherited management routes remain `LEGACY_ONLY` until a dedicated
adapter or deprecation PR explicitly changes their mode.
