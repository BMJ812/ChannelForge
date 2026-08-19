# Legacy Identity Resolution

- **Milestone:** 04
- **Unit:** PR 04B â€” Legacy Identity Resolver
- **Mapping namespace:** `tunarr`
- **Runtime authority change:** none
- **Production read cutover:** none

## Purpose

The legacy identity resolver interprets durable migration identity state without
promoting inherited identifiers into ChannelForge canonical identity.

It is generic across entity types.

Concept-specific compatibility reads decide what to do after identity
resolution.

## Resolution Inputs

The resolver receives:

- qualified legacy namespace
- legacy entity type
- opaque legacy identifier
- compatibility concept
- compatibility mode
- operation name
- optional application version
- optional source schema version

Namespace and entity-type labels are normalized.

The opaque legacy identifier is validated for non-blank content but is not
trimmed, case-folded, parsed, or rewritten.

## Precedence

Resolution order is:

```text
1. Durable tombstone
2. Durable legacy mapping
3. Controlled unmapped result
```

A tombstone has precedence over a historical mapping.

This prevents retired, omitted, replaced, merged, invalid, or deleted legacy
identity from silently materializing a target again.

## Resolver Results

### `MAPPED`

Returned only when the mapping state is `VERIFIED`.

Contains:

- mapping ID
- ChannelForge entity type
- ChannelForge canonical identifier

`MAPPED` does not prove the target entity still exists.

The concept-specific compatibility read must validate target existence before
returning canonical domain state.

### `TOMBSTONED`

Contains:

- tombstone ID
- tombstone reason
- optional replacement ChannelForge identity

A replacement is diagnostic guidance.

The resolver does not automatically turn a tombstone into a successful mapping.

### `CONFLICT`

Returned when the mapping state is `CONFLICT` and references durable conflict
identity.

The resolver does not choose a candidate target.

### `UNMAPPED`

Reasons:

- `NOT_FOUND`
- `MAPPING_NOT_VERIFIED`
- `MAPPING_INACTIVE`

`PENDING` and `MAPPED` mappings are not canonical resolution.

`IGNORED`, `SUPERSEDED`, and `ROLLED_BACK` mappings are not active resolution.

### `ERROR`

A mapping marked `CONFLICT` without a durable conflict ID fails safely as:

```text
COMPATIBILITY_CONFLICT
CONFLICT_RECORD_MISSING
```

No target is selected.

## Durable Tombstones

Migration `0006_legacy_identity_tombstone` adds:

```text
cf_legacy_identity_tombstone
```

The table records:

- ChannelForge tombstone ID
- qualified legacy identity
- reason
- optional replacement identity
- optional Migration Run
- optional durable conflict
- creation time
- metadata

Supported reasons:

```text
RETIRED
MERGED
INVALID
OMITTED
REPLACED
DELETED
```

Legacy identifier values remain opaque and exact.

The current cardinality is one tombstone per qualified legacy identity.

## Metrics

PR 04B adds:

```text
TOMBSTONE_LOOKUPS
TOMBSTONE_HITS
```

and the bounded result:

```text
TOMBSTONED
```

The resolver also records:

- `MAPPING_LOOKUPS`
- `MAPPING_CONFLICTS`
- `UNMAPPED_LEGACY_IDS`
- `COMPATIBILITY_ERRORS`
- `COMPATIBILITY_LATENCY`

Metric dimensions do not contain raw legacy or ChannelForge identifiers.

## Authority

PR 04B does not change:

- inherited read authority
- inherited write authority
- route registration
- job registration
- scheduler authority
- output authority
- provider synchronization authority

The resolver is infrastructure for later canonical-first compatibility reads.

## Lazy Mapping

PR 04B performs no lazy mapping.

Resolver reads are non-mutating except for metrics.

Lazy mapping policy, race handling, idempotency, audit, and mapping creation
remain PR 04D scope.

## Rollback

Application rollback may stop using the resolver.

Migration `0006` is additive and the tombstone table remains as compatibility
history.

No inherited Tunarr table is modified or deleted.
