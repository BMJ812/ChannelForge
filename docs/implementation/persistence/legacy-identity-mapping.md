# ChannelForge Legacy Identity Mapping

- **Milestone:** 03
- **Schema migration:** `0004_legacy_identity_mapping`
- **Initial legacy namespace:** `tunarr`
- **Initial cardinality:** one-to-one

## Purpose

Legacy identifiers remain compatibility references.

They are not reinterpreted as ChannelForge identifiers.

The durable mapping layer records the relationship between inherited Tunarr
identity and ChannelForge-owned identity.

## Initial Instance Mapping

The initial compatibility proof is:

```text
SettingsDB.clientId()
        |
        v
tunarr / instance / <legacy identifier>
        |
        v
cf_legacy_identity_mapping
        |
        v
instance / <ChannelForge InstanceId>
```

The two identifiers remain distinct.

## Initial Cardinality

Migration 0004 deliberately supports `ONE_TO_ONE`.

The database enforces uniqueness on both sides of that relationship.

Split and merge mappings require an explicit future schema decision rather than
silently weakening this initial invariant.

## Mapping Status

Persisted states are:

- `PENDING`
- `MAPPED`
- `VERIFIED`
- `CONFLICT`
- `IGNORED`
- `SUPERSEDED`
- `ROLLED_BACK`

The initial service creates `MAPPED` records and supports transition to
`VERIFIED`.

## Conflict Rules

A mapping conflict occurs when:

- One legacy identity is already associated with another ChannelForge target.
- One ChannelForge target is already claimed by another legacy identity.

Service-level conflict detection provides explicit semantics.

SQLite uniqueness constraints remain the final concurrency guard.

## Restart Safety

Repeating the same mapping request returns the existing mapping.

A migration retry therefore does not generate a replacement relationship when
the durable mapping already exists.

## Compatibility Authority

This unit does not flip compatibility reads.

Tunarr remains authoritative for inherited runtime state.

`cf_legacy_identity_mapping` is authoritative only for the recorded
identity relationship.

## Rollback

Migration 0004 is additive.

No inherited Tunarr identifier is modified or deleted.

## Durable Conflict Evidence

When one-to-one identity mapping is executed as part of a Migration Run, a
semantic source or target conflict is persisted to `cf_migration_conflict` as
`OPEN` before the conflict is returned to the caller.

The conflict record includes source reference, candidate targets, existing
mapping evidence, timestamp, and Migration Run identity.

The durable record survives database close/reopen.

## Opaque Legacy Identifier Rule

Legacy identifier values are validated for non-blank content but are not
trimmed, case-folded, parsed as UUIDs, or otherwise normalized by the generic
mapping service.

Namespace and entity-type labels are normalized separately.
