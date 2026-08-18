# Scheduling Module

## Purpose

Scheduling owns deterministic Schedule Plan generation.

## Public Interface

- `SchedulePlanId`
- `ScheduleEntryId`
- `SchedulePlan`
- `ScheduleEntry`
- `ScheduleGenerationRequest`
- `ScheduleGenerationPort`
- `SchedulingCommandService`
- `createSchedulingModule()`

## Dependencies

Scheduling consumes public identifiers from Networks, Channels, Programming,
and Catalog.

Generation receives an explicit planning horizon and explicit seed.

## Forbidden Dependencies

Scheduling must not depend on FFmpeg, Playout, provider stream URLs, active
client sessions, Fastify request state, process-global randomness, or implicit
wall-clock reads.

## Persistence

No Schedule Plan persistence is introduced or migrated in this M02 unit.

## Runtime Migration

The inherited scheduler is not replaced by this shell.

## Migration Status

Shell and deterministic generation port established.
