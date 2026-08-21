# Legacy Job Registry

## Scope

PR 04M inventories inherited Tunarr background jobs, classifies their behavior,
adds a compatibility handler boundary, and records bounded usage.

It does **not** change production scheduling, startup wiring, provider calls,
write authority, or freeze state.

## Classification

The exact roadmap vocabulary is:

`READ_ONLY`, `LEGACY_WRITE`, `COMPATIBILITY_PROJECTION`,
`PROVIDER_SYNCHRONIZATION`, `SCHEDULE_GENERATION`, `ARTIFACT_GENERATION`,
`CLEANUP`, `BACKUP`, `UNKNOWN`.

A job may carry multiple classifications when its inherited behavior crosses
concerns.

Triggers are `STARTUP`, `SCHEDULED`, and `DYNAMIC`.

## Inventory

The registry contains 25 concrete runtime job identities:

| Job | Classification | Trigger |
| --- | --- | --- |
| BackupTask | BACKUP | SCHEDULED |
| CleanupSessionsTask | CLEANUP, LEGACY_WRITE | SCHEDULED |
| ClearM3uCacheTask | CLEANUP | DYNAMIC |
| OnDemandChannelStateTask | LEGACY_WRITE | SCHEDULED, STARTUP |
| ReconcileProgramDurationsTask | LEGACY_WRITE | DYNAMIC |
| RefreshMediaSourceLibraryTask | PROVIDER_SYNCHRONIZATION, LEGACY_WRITE | SCHEDULED, STARTUP |
| RemoveDanglingProgramsFromSearchTask | CLEANUP, LEGACY_WRITE | DYNAMIC |
| RollLogFileTask | CLEANUP | DYNAMIC |
| ScanLibrariesTask | PROVIDER_SYNCHRONIZATION, LEGACY_WRITE | SCHEDULED |
| SubtitleExtractorTask | ARTIFACT_GENERATION | SCHEDULED, STARTUP |
| SyncCollectionsTask | PROVIDER_SYNCHRONIZATION, LEGACY_WRITE | SCHEDULED |
| SyncCustomShowsTask | PROVIDER_SYNCHRONIZATION, LEGACY_WRITE | SCHEDULED |
| UpdateXmlTvTask | ARTIFACT_GENERATION, PROVIDER_SYNCHRONIZATION, LEGACY_WRITE | SCHEDULED, STARTUP |
| UpdatePlexPlayStatusScheduledTask | PROVIDER_SYNCHRONIZATION | DYNAMIC, SCHEDULED |
| UpdatePlexPlayStatusTask | PROVIDER_SYNCHRONIZATION | DYNAMIC |
| UpdateJellyfinPlayStatusScheduledTask | PROVIDER_SYNCHRONIZATION | DYNAMIC, SCHEDULED |
| UpdateJellyfinPlayStatusTask | PROVIDER_SYNCHRONIZATION | DYNAMIC |
| ChannelLineupMigratorStartupTask | LEGACY_WRITE | STARTUP |
| ClearM3uCacheStartupTask | CLEANUP | STARTUP |
| GenerateGuideStartupTask | ARTIFACT_GENERATION | STARTUP |
| RefreshLibrariesStartupTask | PROVIDER_SYNCHRONIZATION, LEGACY_WRITE | STARTUP |
| ScheduleJobsStartupTask | READ_ONLY | STARTUP |
| SeedFfmpegInfoCache | READ_ONLY | STARTUP |
| SeedSystemDevicesStartupTask | LEGACY_WRITE | STARTUP |
| FixerRunner | LEGACY_WRITE | STARTUP |

Framework helpers (`Task2`, `SimpleTask`, `TaskRegistry`, `ScheduledTask`,
`OneOffTask`, `CompoundTask`, `NoopTask`, `TasksModule`, `StartupService`) are
not jobs. Individual fixers remain internal steps of `FixerRunner`.

## Compatibility Handler

The handler may resolve a registered job, translate input, call a caller-supplied
compatibility action, record bounded status, record usage, and consult an
external execution policy.

It imports no inherited task, scheduler, database, or provider implementation.
Unknown jobs fail closed. Raw input and raw exceptions are not returned.

An external policy can deny execution; the handler has no bypass after denial.
This prepares PR 04N, but 04M installs no production freeze policy.

## Usage

04M uses the existing `LEGACY_JOB_EXECUTIONS` counter. The operation dimension
is a bounded registered job ID. Unknown-job metrics use the fixed
`unknown-job` operation.

Raw channel, program, source, session, provider-item, credential, and request
values are not dimensions.

## Runtime Impact

```text
Production job wiring:        unchanged
Production scheduler:         unchanged
Startup execution:            unchanged
Legacy write freeze:          not activated
Provider calls from 04M:      none
Persistence/schema changes:   none
Job removal:                  none
```

Rollback is code-only: stop consuming the registry/handler contracts.
