# Media Sources Module

## Purpose

Media Sources owns configured external media-server connections,
library bindings, provider capabilities, and synchronization requests.

PR 02F establishes the public module shell and provider boundaries.

## Public Interface

- `MediaSourcesCommandService`
- `MediaSourceProviderAdapter`
- `MediaSourceProviderAdapterRegistry`
- `MediaSourceSynchronizationPort`
- Media Source and library identifiers
- Provider-neutral library observations

## Provider Boundary

Plex, Jellyfin, and Emby implementations remain outside the module.
Provider-native payloads must be translated before crossing this boundary.

## Synchronization

The synchronization port represents requests to scan existing source data.
PR 02F does not replace the inherited scanner implementation.

## Catalog Boundary

Media Sources does not own Catalog Item identity or Catalog persistence.
Normalized Catalog observations are consumed through the Catalog boundary.

## Persistence

No Media Sources persistence is introduced or migrated by PR 02F.

## Migration Status

Shell established. Existing provider and scanner implementations remain
inherited in place. ChannelForge synchronization requests reach the inherited
scan coordinator through the Tunarr compatibility boundary.
