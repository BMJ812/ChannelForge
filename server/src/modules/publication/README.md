# Publication Module

## Purpose

Publication owns the active approved Schedule Plan boundary consumed by
downstream runtime and output systems.

## Public Interface

- `SchedulePublicationId`
- `SchedulePublication`
- `PublishedScheduleEntry`
- `PublishedScheduleReader`
- `PublicationQueryService`
- `createPublicationModule()`

## Dependencies

Publication references Channels and Scheduling only through public contracts.

## Forbidden Dependencies

Publication does not generate schedules, start FFmpeg, resolve provider
playback, serialize XMLTV, or own Channel editorial identity.

## Persistence

No publication persistence or active-plan cutover is introduced in this M02
unit.

## Runtime Migration

The inherited active schedule implementation remains unchanged.

## Migration Status

Shell and published-schedule read port established.
