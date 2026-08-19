# First Compatibility Read

- **Milestone:** 04
- **Unit:** PR 04C â€” First Compatibility Read
- **Concept:** Instance identity used as Jellyfin login device identity
- **Route:** `POST /jellyfin/login`
- **Mode:** `CANONICAL_READ_LEGACY_FALLBACK`
- **Write authority change:** none
- **Lazy mapping:** none

## Why This Read

The runtime audit found one existing production import of the Tunarr
compatibility boundary:

```text
server/src/api/jellyfinApi.ts
```

The route already obtains device identity through a compatibility adapter before
calling Jellyfin.

That makes it a narrow, read-only, low-risk compatibility cutover.

The Emby login route still reads inherited `SettingsDB.clientId()` directly and
is not changed in PR 04C.

## Production Read Flow

```text
POST /jellyfin/login
  -> CanonicalFirstTunarrInstanceIdentityReader
     -> shared inherited SQLite connection
     -> ChannelForge schema present?
        no  -> legacy fallback
        yes -> persisted cf_instance present?
               no  -> legacy fallback
               yes -> resolve tunarr/instance/<legacy client ID>
                      tombstone -> legacy fallback + warning
                      conflict  -> legacy fallback + warning
                      unmapped  -> legacy fallback + warning
                      mapped    -> validate target type + persisted Instance ID
                                   mismatch -> legacy fallback + warning
                                   match    -> canonical InstanceId
  -> JellyfinApiClient.login(..., selected instance ID)
```

## Shared Database Connection

PR 04C does not create a second production SQLite connection.

The compatibility read uses the existing inherited `DBAccess` SQLite connection
when available.

It does not run ChannelForge migrations.

It does not create ChannelForge tables.

It does not bootstrap `cf_instance`.

It does not create legacy mappings.

If the ChannelForge identity tables are absent, the reader explicitly falls
back to inherited identity.

## Canonical Preconditions

A canonical result requires all of the following:

- shared SQLite connection available
- `cf_instance` exists
- `cf_legacy_identity_mapping` exists
- `cf_legacy_identity_tombstone` exists
- persisted singleton ChannelForge Instance exists
- no matching tombstone
- mapping is `VERIFIED`
- mapping target entity type is `instance`
- mapping target identifier equals persisted ChannelForge `InstanceId`

Anything weaker does not become canonical identity.

## Fallback

Fallback remains the inherited SettingsDB client ID.

Fallback is explicit through:

```text
CompatibilityReadResult
  source = LEGACY_FALLBACK
```

and a bounded warning code.

Initial warning codes include:

```text
CHANNELFORGE_DATABASE_UNAVAILABLE
CHANNELFORGE_SCHEMA_UNAVAILABLE
CHANNELFORGE_INSTANCE_MISSING
LEGACY_MAPPING_NOT_FOUND
LEGACY_MAPPING_NOT_VERIFIED
LEGACY_MAPPING_INACTIVE
LEGACY_IDENTITY_TOMBSTONED
LEGACY_IDENTITY_CONFLICT
LEGACY_IDENTITY_RESOLUTION_ERROR
TARGET_TYPE_MISMATCH
TARGET_IDENTITY_MISMATCH
CANONICAL_READ_ERROR
```

No raw database error is returned to the Jellyfin caller.

## Tombstones and Conflicts

PR 04C does not choose an arbitrary canonical target.

A tombstone blocks canonical resolution.

A durable conflict blocks canonical resolution.

Because this first cutover retains legacy fallback, those states keep the
inherited device identity for the supported legacy path while recording
compatibility metrics and a warning code.

Later freeze/removal work may turn selected conflict states into hard failures.

## Metrics

The route records bounded runtime compatibility metrics.

Relevant counters include:

- `CANONICAL_READS`
- `LEGACY_FALLBACK_READS`
- `MAPPING_LOOKUPS`
- `TOMBSTONE_LOOKUPS`
- `TOMBSTONE_HITS`
- `SHADOW_COMPARISONS`
- `SHADOW_MISMATCHES`
- `MAPPING_CONFLICTS`
- `UNMAPPED_LEGACY_IDS`
- `COMPATIBILITY_ERRORS`

Latency uses:

```text
COMPATIBILITY_LATENCY
```

Metric dimensions remain the PR 04A bounded dimension set.

Raw legacy and ChannelForge IDs are not metric labels.

## Runtime Authority

Read authority for this one route becomes:

```text
Canonical ChannelForge Instance identity
  when canonical preconditions are satisfied

otherwise

Inherited SettingsDB client ID
```

Write authority remains inherited and unchanged.

No route other than Jellyfin login changes behavior in PR 04C.

## Lazy Mapping

No lazy mapping occurs.

Missing or unverified mapping is a fallback result.

PR 04D remains responsible for proposed mapping creation, idempotency, race
handling, conflict creation, and audit.

## Rollback

Rollback is code-only:

- restore Jellyfin login to `TunarrInstanceIdentityAdapter`
- keep all ChannelForge persistence and mapping history intact

No data rollback is required because PR 04C performs no compatibility writes.
