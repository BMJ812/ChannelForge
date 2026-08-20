# Compatibility Write Authority

- **Milestone:** 04
- **Current unit:** PR 04H - Compatibility Write Status
- **Rule:** exactly one authoritative writer exists per concept per phase

## Authority Matrix

| Concept | Phase | Authoritative writer | Compatibility target | Failure policy | Freeze gate |
| --- | --- | --- | --- | --- | --- |
| Media Source scan policy - 04G route proof | `LEGACY_ONLY` | Inherited Tunarr settings | None | ChannelForge application validation fronts the inherited write; legacy remains authoritative | Canonical persistence and replacement route required |
| Generic temporary write translation framework | Framework only; not activated | Future caller-declared ChannelForge command | One required derived legacy projection | Durable `PENDING`; explicit `CURRENT`, `FAILED`, or `DEGRADED`; reconciliation requested after post-commit failure | Concept-specific preflight required |

## Single-Writer Rule

The 04H framework does not authorize two independent writers.

A future caller may use `CompatibilityWriteCoordinator` only after its concept
has an explicit mode transition and authority record.

The flow is one command:

```text
validated command
  -> authoritative ChannelForge commit
  -> required legacy compatibility projection
```

The legacy projection is derived compatibility state, not a second command
authority.

## Durable Status

Migration `0007_compatibility_status` adds:

```text
cf_compatibility_status
```

The record stores:

- compatibility status ID
- concept type and stable subject key
- optional ChannelForge and qualified legacy identity
- compatibility mode and write state
- canonical and legacy versions
- attempt/success timestamps
- failure count and stable error code
- reconciliation requirement and optional job ID
- optional conflict ID
- optimistic-concurrency version

States:

```text
CURRENT
PENDING
DEGRADED
FAILED
CONFLICT
FROZEN
RETIRED
```

## Partial Failure

If `PENDING` cannot be persisted, the authoritative command does not run.

If the authoritative command fails, legacy projection does not run.

If the authoritative commit succeeds and legacy projection fails, canonical
authority is retained, status becomes `DEGRADED`, and reconciliation is
requested.

If projection succeeds but `CURRENT` status persistence fails, the projection
is not repeated blindly. The result is explicitly degraded and status recovery
is requested through reconciliation.

If reconciliation enqueue fails, durable degraded status remains when status
persistence is available and the caller receives an explicit non-enqueued
result.

PR 04I implements reconciliation jobs and findings.

## Metrics

04H uses the existing bounded metrics:

```text
LEGACY_WRITE_ATTEMPTS
TEMPORARY_TRANSLATION_SUCCESSES
TEMPORARY_TRANSLATION_FAILURES
COMPATIBILITY_ERRORS
RECONCILIATION_QUEUE_DEPTH
COMPATIBILITY_LATENCY
```

Raw ChannelForge IDs, legacy IDs, subject keys, and correlation IDs are not
metric dimensions.

## Activation

No production concept changes to `TEMPORARY_WRITE_TRANSLATION`.

No production dual-write is enabled.

No legacy writer is frozen.
