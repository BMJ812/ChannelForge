# Programming Module

## Purpose

Programming owns editorial configuration used by Scheduling to generate
Schedule Plans.

## Public Interface

- `ProgrammingConfigurationId`
- `ProgrammingConfigurationRevisionId`
- `ProgrammingTarget`
- `ProgrammingCommandService`
- `ProgrammingQueryService`
- `createProgrammingModule()`

## Dependencies

Programming may reference Networks and Channels through public identifiers.

## Forbidden Dependencies

Programming does not execute candidate selection, persist Schedule Plans,
start FFmpeg, synchronize providers, or normalize Catalog metadata.

## Persistence

No Programming persistence is introduced or migrated in this M02 unit.

## Runtime Migration

None.

## Migration Status

Shell established. Activated revision immutability remains a later domain
implementation concern.
