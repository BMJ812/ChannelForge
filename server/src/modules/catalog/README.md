# Catalog Module

## Purpose

Catalog owns normalized programmable media, ChannelForge catalog identity,
source bindings, availability, hierarchy, and normalized metadata policy.

PR 02F establishes the source-observation boundary only.

## Public Interface

- `CatalogItemId`
- `CatalogSnapshotId`
- `CatalogCommandService`
- `CatalogSourceObservationPort`
- `CatalogSourceObservation`
- Provider-neutral source references and metadata observations

## Source Observation Boundary

External provider payloads do not cross this module boundary.

Observations identify the Media Source, external item, optional external
library, observation time, and a deliberately small normalized metadata
surface.

The observation contract does not expose inherited Program rows, ORM
records, provider clients, or provider-native payloads.

## Media Sources Dependency

Catalog references Media Sources only through its public `MediaSourceId`
contract.

Catalog does not call Plex, Jellyfin, or Emby clients directly.

## Persistence

No Catalog persistence is introduced or migrated by PR 02F.

The inherited Program and ProgramGrouping persistence remains unchanged.

## Runtime Migration

None in this shell.

Existing scanners continue their inherited persistence behavior until a
later compatibility adapter can safely translate observations without a
schema or runtime cutover.

## Migration Status

Shell established.
