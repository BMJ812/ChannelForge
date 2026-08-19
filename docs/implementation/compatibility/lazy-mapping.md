# Lazy Mapping

- **Milestone:** 04
- **Unit:** PR 04D â€” Lazy Mapping
- **Initial concept:** Instance identity
- **Initial route:** `POST /jellyfin/login`
- **Mode:** `CANONICAL_READ_LEGACY_FALLBACK`
- **Policy:** `JELLYFIN_LOGIN_INSTANCE_IDENTITY`
- **Write authority:** unchanged
- **New schema migration:** none

## Purpose

PR 04D permits one compatibility read to create identity mapping metadata only
when a narrow policy proves that the legacy identity and an already-existing
ChannelForge target represent the same singleton Instance.

Lazy mapping is not a general entity-creation path.

It does not create a ChannelForge Instance.

It does not create provider state.

It does not write inherited Tunarr domain state.

## Explicit Policy

Lazy mapping is disabled unless the caller supplies:

```text
JELLYFIN_LOGIN_INSTANCE_IDENTITY
```

That policy is accepted only for:

```text
operation:     jellyfin-login-device-identity
route:         /jellyfin/login
namespace:     tunarr
legacy type:   instance
target type:   instance
```

Using the policy outside that context is rejected.

## Eligibility

The lazy mapping transaction requires:

- compatibility policy explicitly enabled
- legacy identifier present and opaque
- persisted singleton ChannelForge Instance already exists
- proposed target exactly equals the persisted ChannelForge InstanceId
- no tombstone exists
- no incompatible legacy-side mapping exists
- no incompatible target-side mapping exists
- operational audit table exists
- idempotency table exists
- mapping table exists
- tombstone table exists
- transaction can acquire an immediate SQLite write transaction

## Verification Decision

The initial Instance policy creates the mapping as `MAPPED` and verifies it in
the same transaction.

That is allowed only because the policy is scoped to one installation-level
singleton:

```text
Tunarr SettingsDB client ID
    -> persisted ChannelForge Instance
```

The target already exists before mapping creation.

No generic entity type inherits this automatic verification policy.

## Atomicity

The mapping transaction uses the existing:

```text
SqliteTransactionCoordinator
```

with an immediate SQLite transaction.

The atomic operation includes:

- target re-check
- tombstone re-check
- mapping uniqueness re-check
- idempotency begin
- mapping creation
- mapping verification
- success audit
- idempotency completion

An exception rolls back the mutation.

## Idempotency

PR 04D reuses:

```text
cf_idempotency_record
```

The idempotency key is derived from a SHA-256 digest of the qualified legacy
identity.

The request hash includes:

- policy
- compatibility phase
- qualified legacy identity
- target identity
- operation
- route template
- application version
- source schema version

Raw identifiers are not metric dimensions.

Repeated identical reads reuse the verified mapping and do not create duplicate
mapping or success-audit rows.

## Audit

PR 04D reuses:

```text
cf_audit_record
```

A successful creation records:

- compatibility runtime actor
- lazy-mapping action
- mapping ID
- policy
- reason
- compatibility phase `M04-04D`
- source namespace
- source entity type
- target entity type
- application version
- correlation ID when supplied
- success outcome
- timestamp

Incompatible proposals record a failure audit.

## Competing Readers

The immediate transaction serializes compatible writers.

For the same qualified legacy identity and same target:

```text
first reader  -> creates + verifies one mapping
later reader  -> reuses the verified mapping
```

For a different legacy identity attempting to claim the already-mapped singleton
target:

```text
existing mapping remains intact
new proposal becomes CONFLICT
failure audit is durable
no arbitrary target is selected
```

The unique mapping constraints remain the final database backstop.

## Tombstones

A tombstone is re-checked inside the mapping transaction.

A tombstoned identity is never recreated.

The outcome is conflict plus legacy fallback for the current supported route.

## Read Result

On successful creation or safe reuse, the same Jellyfin login read may return
the canonical ChannelForge InstanceId.

If lazy mapping cannot be performed safely, the route retains explicit legacy
fallback.

New bounded warning codes distinguish:

```text
LAZY_MAPPING_POLICY_REJECTED
LAZY_MAPPING_SUPPORT_UNAVAILABLE
LAZY_MAPPING_CONFLICT
LAZY_MAPPING_FAILED
```

## Metrics

Successful creation increments:

```text
MAPPING_CREATIONS
LAZY_MAPPINGS
```

Incompatible proposals increment:

```text
MAPPING_CONFLICTS
```

Unexpected failures increment:

```text
COMPATIBILITY_ERRORS
```

The existing canonical/fallback read metrics continue to identify the final
read source.

## Authority

PR 04D does not change the compatibility mode.

Jellyfin login remains:

```text
CANONICAL_READ_LEGACY_FALLBACK
```

Read authority is canonical only after the mapping is verified.

Inherited write authority remains unchanged.

The lazy write changes Migration-owned compatibility metadata only.

## Rollback

Rollback is code-only:

- disable the Jellyfin lazy-mapping policy
- retain mappings already created and audited
- continue canonical-first reads for mappings already verified
- continue legacy fallback for unmapped identities

No destructive database rollback is required.
