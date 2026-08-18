# Playout Module

## Purpose

Playout owns runtime playback decisions and active stream-session boundaries.

## Public Interface

- `PlayoutSessionId`
- `PlayoutSessionStatus`
- `PlaybackResolver`
- `StreamProcessRunner`
- `createPlayoutModule()`

## Dependencies

Playout consumes published schedule state through Publication's public reader.

Provider playback resolution and stream process execution remain ports.

## Forbidden Dependencies

Playout does not generate schedules, mutate Programming configuration, own
provider credentials, or spawn FFmpeg directly.

## Persistence

No Playout persistence is introduced or migrated in this M02 unit.

## Runtime Migration

The inherited runtime remains unchanged. Concrete runtime wrapping is deferred
until a narrow inherited session/process seam is migrated.

## Migration Status

Shell, playback-resolution boundary, and stream-process boundary established.
