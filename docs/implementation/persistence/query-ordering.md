# ChannelForge Query Ordering Policy

- **Milestone:** 03
- **Status:** Enforced for current persistence scope

Any multi-row query whose order can affect behavior must declare an explicit,
stable order.

## Required Pattern

Behavior-affecting reads use:

```text
ORDER BY <behavioral key>, <unique tie-breaker>
```

A primary key or other unique key is used as the final tie-breaker when the
behavioral key is not unique.

## Current M03 Evidence

The current persistence scope includes explicit ordering for:

- schema migration history by `migration_id`
- migration conflict review by `detected_at`, then conflict ID
- synthetic batch verification by source identity

Tests assert the resulting order.

## Non-Behavioral Reads

Single-row primary-key lookups do not require `ORDER BY`.

SQLite pragma result sets used only for integrity evaluation are interpreted by
their semantics rather than user-visible ordering.

## Future Repository Rule

Any future repository or query service that returns an ordered collection must
add a contract test that proves deterministic order. Relying on SQLite row,
insertion, or index order is prohibited.
