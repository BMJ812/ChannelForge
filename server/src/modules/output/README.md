# Output Module

## Purpose

Output owns ChannelForge guide, playlist, HDHomeRun-compatible, and stream-route
presentation boundaries.

## Public Interface

- `OutputProfileId`
- `OutputArtifact`
- `OutputStreamRoute`
- `OutputArtifactReader`
- `OutputQueryService`
- `createOutputModule()`

## Dependencies

Output consumes canonical identities supplied by owning modules.

## Forbidden Dependencies

Output does not generate schedules, own Channel identity, or manage FFmpeg
process lifecycle.

## Persistence

No Output persistence or artifact-store cutover is introduced in this M02 unit.

## Runtime Migration

Existing XMLTV, M3U, HDHomeRun-compatible, and streaming implementations remain
unchanged.

## Migration Status

Shell and Output read-model boundary established.
