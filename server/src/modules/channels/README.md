# Channels Module

## Purpose

Channels owns ChannelForge tuneable broadcast identity, Channel numbering,
profile revisions, lifecycle, and Network membership.

## Public Interface

- `ChannelId`
- `ChannelNumber`
- `ChannelProfileRevisionId`
- `ChannelCommandService`
- `ChannelQueryService`
- `createChannelsModule()`

## Dependencies

Channels may reference Networks through its public identifiers.

## Forbidden Dependencies

Channels does not own scheduling, publication, FFmpeg, XMLTV, M3U, or
HDHomeRun transport behavior.

## Persistence

No Channel persistence is introduced or migrated in this M02 unit.

## Runtime Migration

None.

## Migration Status

Shell established. Channel owns the future canonical ChannelForge identifier.
