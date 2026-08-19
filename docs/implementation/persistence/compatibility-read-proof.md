# ChannelForge Compatibility Read Proof

- **Milestone:** 03
- **Concept:** Instance identity
- **Strategy:** verified mapping to ChannelForge, legacy fallback
- **Runtime cutover:** not performed

## Purpose

Milestone 03 requires one compatibility read path that actually uses a durable
legacy-to-ChannelForge mapping.

`MappedTunarrInstanceIdentityReader` is the representative proof.

It composes only public module ports:

- `InstanceIdentityReader`
- `InstanceRepository`
- `LegacyIdentityMappingRepository`

It does not import SQLite infrastructure.

## Read Algorithm

1. Read the inherited Tunarr Instance identity.
2. Read the persisted ChannelForge Instance.
3. Resolve `tunarr / instance / <legacy ID>` through the legacy mapping
   repository.
4. Require a `VERIFIED` mapping.
5. Require target entity type `instance`.
6. Require the mapped target ID to equal the persisted ChannelForge Instance ID.
7. Return the canonical ChannelForge Instance ID only when all checks pass.
8. Otherwise preserve the inherited legacy identity.

## Shadow Comparison

Every proof read records one observable finding:

- `MAPPED_MATCH`
- `MAPPING_MISSING`
- `MAPPING_NOT_VERIFIED`
- `CHANNELFORGE_INSTANCE_MISSING`
- `TARGET_TYPE_MISMATCH`
- `TARGET_IDENTITY_MISMATCH`

The snapshot exposes:

- mapped read count
- legacy fallback count
- mismatch count
- last finding

## Authority

This is a proof path, not production authority cutover.

The existing Tunarr runtime reader remains unchanged.

A mismatch fails back to the inherited identity rather than silently switching
authority.
