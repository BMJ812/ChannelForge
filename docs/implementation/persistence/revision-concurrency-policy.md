# ChannelForge Revision, Serialization, and Concurrency Policy

- **Milestone:** 03
- **Status:** Accepted

## Revision Identity

Mutable configuration that requires historical versions uses immutable revision
identifiers.

Initial revision identifiers already include:

- `NetworkProfileRevisionId`
- `ChannelProfileRevisionId`

A revision ID is never the human revision number.

Activated revision content is immutable. A later change creates a new revision
with a new ChannelForge-owned ID.

## Canonical Serialization

Content hashing must use one deterministic representation.

The policy is:

1. Object properties are serialized in lexical key order.
2. Array order is preserved.
3. ChannelForge UUIDs use canonical lowercase text.
4. Instants use UTC ISO-8601 text.
5. `undefined` is not persisted as a JSON value.
6. `null` remains explicit.
7. Numbers use JSON number representation and must be finite.
8. Strings are UTF-8 JSON strings without provider-specific normalization.
9. Provider and legacy opaque identifier values are not trimmed or case-folded
   unless the owning provider policy explicitly requires it.
10. Hash input includes an explicit schema/version discriminator.

A future revision-hash implementation must test this policy before hashes become
persistent compatibility contracts.

## Optimistic Concurrency

Mutable aggregates use an integer `version`.

The representative `cf_instance` aggregate proves:

```text
UPDATE ... WHERE version = expectedVersion
```

Successful updates increment the version.

A zero-row update is reconciled into either not-found or stale-version behavior.

Immutable revisions do not use mutable-version updates after activation.

## API Mapping

Future ETags may derive from the persisted integer version or immutable revision
identity. The API milestone must document the exact public representation before
exposure.
