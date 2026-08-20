# Provider Compatibility Policy

- **Milestone:** 04 â€” Legacy Compatibility
- **Unit:** PR 04J â€” Provider Compatibility
- **Production cutover:** none
- **Authority transition:** none
- **Legacy write freeze:** not activated
- **Schema migration:** none

## Purpose

Provider compatibility translates inherited Tunarr Media Source configuration
into ChannelForge-owned read contracts without making inherited provider rows,
credentials, or provider payloads part of the ChannelForge domain.

04J is a read-side anti-corruption boundary.

It does not migrate Media Source persistence.

It does not change provider write authority.

## Target Ownership

The Media Sources module owns the ChannelForge read contract.

The Tunarr compatibility namespace owns translation from inherited state.

The canonical contract contains:

- canonical Media Source identity
- remote provider kind
- display name
- provider connection configuration
- opaque credential reference
- configured library bindings
- configured path replacements

The canonical contract contains no inherited database row type.

## Identity Rule

The caller supplies an already-resolved ChannelForge `MediaSourceId`.

The translator must not cast or reuse the inherited Tunarr Media Source UUID as
canonical identity.

Identity mapping remains outside provider translation.

## Credential Rule

Inherited Tunarr stores remote Media Source credentials in the
`media_source.accessToken` column.

04J does not copy that plaintext value into a ChannelForge read model.

Instead, compatibility emits an opaque credential reference:

```text
tunarr-media-source:<legacy-media-source-id>:access-token
```

The reference identifies where compatibility-owned credential resolution may
occur.

The reference is not the credential.

No plaintext credential is:

- returned in the ChannelForge Media Source read model
- logged by translation errors
- written to a second persistence location
- embedded in provider configuration
- used as a metric dimension

04J introduces no credential persistence and no plaintext dual-write.

## Provider Configuration

Remote provider configuration preserves non-secret inherited intent:

- provider kind
- URI
- client identifier when present
- username when present
- provider user ID when present
- channel-update preference
- guide-update preference

Whitespace-only optional fields are omitted.

Blank required source name or URI is rejected.

## Library Configuration

Configured legacy library bindings translate to provider-neutral read models:

- external library ID
- display name
- media kind
- enabled state

Legacy library row identity does not become canonical library identity.

A library belonging to a different legacy Media Source is rejected rather than
silently attached.

## Path Replacement Configuration

Configured replace-path rules preserve:

- server path
- local path

A rule belonging to another legacy Media Source is rejected.

04J performs no filesystem mutation.

## Provider Calls

Read translation is pure and synchronous.

It performs no Plex, Jellyfin, or Emby call.

It performs no provider discovery.

It performs no provider authentication.

Provider calls remain behind the Media Sources provider adapter boundary.

## Writes

04J performs no Media Source write.

It performs no legacy write.

It performs no canonical write.

It performs no dual-write.

It does not change the existing synchronization adapter.

## Supported Providers

04J remote read translation supports:

```text
plex
jellyfin
emby
```

`local` is outside this provider-compatibility translator and is rejected at
runtime if passed through an unsafe boundary.

## Error Safety

Translation failures use bounded reason codes.

Error messages do not serialize the inherited row or credential.

Supported reasons:

```text
UNSUPPORTED_SOURCE_KIND
INVALID_SOURCE_NAME
INVALID_SOURCE_URI
FOREIGN_LIBRARY
FOREIGN_PATH_REPLACEMENT
```

## Rollback

Rollback is code-only:

- stop consuming the 04J translated read model
- remove the provider translator from runtime composition if later activated

There is no 04J schema state to roll back.

Inherited provider state remains authoritative and untouched.

## Activation

04J establishes contracts and translation only.

A later composition change may wire provider compatibility reads into runtime
callers after explicit authority and fallback review.

## Completion Gate

04J is complete when:

- ChannelForge owns the provider-neutral Media Source read model
- Plex, Jellyfin, and Emby legacy configuration translates deterministically
- canonical identity must be supplied externally
- credential output is reference-only
- plaintext access tokens are absent from translation output
- configured libraries translate
- replace-path configuration translates
- foreign related rows fail closed
- local sources fail closed
- no provider call is made by translation
- no persistence migration is introduced
- no plaintext dual-write is introduced
