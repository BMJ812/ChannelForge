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

## Scan Policy Application Boundary

PR 04G adds a provider-neutral Media Source scan policy application service.

The canonical contract uses:

```text
intervalHours
```

Inherited Tunarr `rescanIntervalHours` naming is translated only inside the
compatibility boundary.

The application service owns validation and command flow.

PR 04G does not introduce Media Sources persistence. The compatibility store
still delegates to inherited Tunarr settings, so write authority remains
legacy.

## PR 04J Provider Compatibility Read Contract

PR 04J adds the provider-neutral remote Media Source read model owned by this
module.

The contract includes canonical Media Source identity, provider kind,
non-secret provider configuration, an opaque credential reference, configured
library bindings, and path replacements.

The Media Sources module does not import inherited Tunarr rows.

Tunarr translation remains under `server/src/compatibility/tunarr/providers/`.

The credential reference is a locator only. The canonical read model does not
contain the inherited plaintext `accessToken`.

PR 04J adds no Media Source persistence and changes no write authority.
