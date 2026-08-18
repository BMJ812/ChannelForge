# ChannelForge Identifier Policy

- **Milestone:** 03
- **Status:** Accepted for initial implementation
- **Format:** UUIDv4
- **Canonical representation:** Lowercase UUID text
- **SQLite representation:** `TEXT`

## Decision

Initial ChannelForge-owned identifiers use UUIDv4.

UUIDv4 was selected from the formats already permitted by the M03 roadmap.

It provides opaque identity without embedding creation time and requires no new
runtime dependency because generation uses the Web Crypto API available in the
supported Node.js runtime and modern browser environments.

The reduced insertion locality compared with UUIDv7 is accepted for the
initial home-server persistence baseline and may be revisited only with
measured evidence.

## Runtime Contract

Each module-owned identifier uses a branded TypeScript string type and an
identifier codec exposing:

- `generate`
- `parse`
- `tryParse`
- `toString`

Parsing validates syntax only. It does not verify database existence.

Uppercase UUID text is rejected rather than silently normalized.

## Initial Branded Identifier Set

The first M03 implementation establishes:

- `InstanceId`
- `MediaSourceId`
- `MediaSourceLibraryId`
- `CatalogItemId`
- `CatalogSnapshotId`
- `NetworkId`
- `NetworkProfileRevisionId`
- `ChannelId`
- `ChannelProfileRevisionId`

Additional module-owned identifiers adopt the same primitive when their
persistence work begins.

## Legacy Identity

Inherited Tunarr identifiers remain compatibility references.

A legacy identifier is never parsed or reinterpreted as a ChannelForge UUID
merely because both are represented as strings.

The persisted mapping between legacy identity and ChannelForge identity belongs
to later M03 migration work.

## External Identity

Provider identifiers remain qualified external identifiers.

A Plex, Jellyfin, Emby, or other provider identifier cannot become a
ChannelForge-owned identifier.

## Storage

Persistent ChannelForge identifiers use lowercase UUID text in SQLite `TEXT`
columns.

Once an identifier is persisted, exposed, or referenced, it is not regenerated
during retry or rollback.
