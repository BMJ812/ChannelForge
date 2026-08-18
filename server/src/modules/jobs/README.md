# Jobs Module

## Purpose

Jobs owns application-level background work dispatch and operational job
identity.

## Public Interface

- `JobId`
- `JobRequest`
- `JobDispatcher`
- `JobsCommandService`
- `createJobsModule()`

## Forbidden Dependencies

Job handlers must not become hidden locations for Catalog, Scheduling,
Publication, or Playout business rules.

## Persistence

No job persistence migration is introduced in this M02 unit.

## Runtime Migration

Existing inherited background tasks remain unchanged.

## Migration Status

Shell and job-dispatch boundary established.
