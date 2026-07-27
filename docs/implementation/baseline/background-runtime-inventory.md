# Background Runtime and Authority Inventory

- **Source commit:** `49be6eec67247b5a3c43efaa928953bfd4c852dd`
- **Raw discovery SHA-256:** `f4fe004082aefe1281687a3262b3607fa119038949197a68f975367bb6058080`
- **Normalized discovery SHA-256:** `89c88fffcc9a0fdb1b8e92a901f2686bf648969f517aa8ce72159e0ed1d92f21`
- **Status:** Reviewed static baseline
- **Runtime behavior changed:** No

## Scope and Method

This document records cross-cutting runtime authorities that can mutate state,
contact providers, spawn processes, write files, or execute work outside a
foreground API request.

The collector uses lexical signatures. Counts below are raw candidate counts,
not confirmed call graphs. In particular, the `http-client` rule is broad and
can match generic request identifiers. Each candidate requires source review
before security or ownership classification.

## Static Discovery Summary

| Measure | Count |
| --- | --- |
| Background candidate files | 102 |
| Raw authority sites | 379 |
| Child-process import sites | 6 |
| Filesystem-write sites | 17 |
| HTTP/request candidate sites | 269 |
| Process-spawn sites | 21 |
| Randomness sites | 13 |
| Timer sites | 28 |
| Transaction sites | 25 |
| Unreadable files | 0 |

## Task and Worker Architecture

| Area | Current authority | Observed role |
| --- | --- | --- |
| Task abstraction | `server/src/tasks/Task.ts`; `ScheduledTask.ts`; `OneOffTask.ts`; `CompoundTask.ts` | Defines executable, scheduled, one-off, and composed work |
| Task registry | `TaskRegistry.ts`; `TasksModule.ts` | Registration and lookup of task definitions |
| Task API | `GET /tasks`; `POST /tasks/:id/run` | Inspection and manual execution |
| Scheduler | `server/src/services/Scheduler.ts` | Registers recurring jobs using inherited schedule rules |
| Worker interface | `IWorkerPool.ts`; worker schemas | Abstracts off-main-thread work and request/reply types |
| Worker implementation | `TunarrWorker.ts`; `TunarrWorkerPool.ts` | Worker creation, pooled execution, replies, and failure handling |
| No-op worker | `NoopWorkerPool.ts` | In-process or disabled-worker fallback |
| Startup tasks | `server/src/services/startup/` | Runs migration, guide, cache, library, device, and job startup work |

This task system is infrastructure. It is not the future ChannelForge schedule
planner, even though both use the term scheduler.

## Startup Work

The discovery capture identifies startup tasks for:

- channel-lineup migration,
- M3U cache clearing,
- guide generation,
- media-library refresh,
- recurring-job scheduling,
- system-device seeding.

Startup ordering and failure policy can affect data migration, output freshness,
and provider load. Milestone 10 must define container startup health and
rollback behavior around these tasks.

## Recurring and On-Demand Tasks

High-signal inherited tasks include:

- database backup,
- session cleanup,
- M3U cache invalidation,
- XMLTV refresh,
- provider-library refresh,
- Plex and Jellyfin playback-state reporting,
- on-demand channel-state maintenance,
- program-duration reconciliation,
- search cleanup,
- subtitle extraction,
- log rolling,
- fixers and data backfills.

The task registry should eventually expose explicit ownership, idempotency,
retry policy, cancellation behavior, and audit metadata.

## Authority Classification

| Authority type | Raw sites | Review interpretation |
| --- | --- | --- |
| Process spawn | 21 | High risk. Confirmed examples include FFmpeg/FFprobe and helper processes; some lexical matches can be false positives. |
| Filesystem write | 17 | Includes XMLTV, stream artifacts, subtitles, caches, and tooling writes. |
| Transaction | 25 | Includes catalog, filler, transcode, and fixer transaction candidates. |
| Timer | 28 | Includes session cleanup, stream throttling, event scheduling, API waits, and UI timers. |
| Randomness | 13 | Includes scheduling and test sites; requires deterministic classification. |
| HTTP/request | 269 | Broad discovery signal. Must not be treated as a verified outbound network call without source review. |

## High-Confidence Process Boundaries

Confirmed or strongly indicated process boundaries are concentrated in:

- `server/src/ffmpeg/FfmpegProcess.ts`
- `server/src/ffmpeg/ffmpegText.ts`
- `server/src/ffmpeg/GetLastPtsDuration.ts`
- hardware-capability helper code
- worker creation and worker-thread management
- build and integration-test tooling

ChannelForge plugin contracts must not expose these primitives directly.

## High-Confidence Filesystem Boundaries

Observed runtime write areas include:

- XMLTV output,
- M3U and other file cache entries,
- HLS and transcode-session directories,
- downloaded external subtitles,
- extracted subtitles,
- backup artifacts,
- logs and rolling destinations,
- lineup JSON and soft-delete backups,
- SQLite and settings persistence documented in PR 01C.

The current runtime uses both durable and derived files under inherited data
paths. Cleanup and retention must distinguish authoritative data from
rebuildable output.

## Configuration Signals

The M01D collector found five unique environment keys in its scoped evidence:

| Environment key | Current evidence |
| --- | --- |
| `ENABLE_SSDP_DEBUG_LOGGING` | HDHomeRun/SSDP debug logging |
| `TUNARR_TEST_FFMPEG` | FFmpeg integration-test binary override |
| `TUNARR_TEST_FFPROBE` | FFprobe integration-test binary override |
| `TUNARR_TEST_VAAPI_DEVICE` | VAAPI integration-test device override |
| `TZ` | Scheduling time-zone characterization tests |

The scoped collector did not read environment values. PR 01C remains the
broader configuration inventory.

## Dependency Signals

Relevant inherited dependencies include:

| Dependency | Current role |
| --- | --- |
| `cron-parser` | Recurring schedule parsing |
| `node-schedule` | Background task scheduling |
| `p-queue` | Queued/asynchronous work coordination |
| `random-js` | Random selection used by scheduling and shared code |
| `@iptv/xmltv` | XMLTV document generation |
| `@tunarr/playlist` | Playlist handling |
| `node-ssdp` | HDHomeRun-compatible discovery |
| `hls.js` | First-party web HLS playback |

Dependency presence does not assign final architectural ownership.

## Concurrency and Locking Seams

Source and static review identify multiple process-local synchronization
mechanisms:

- mutexes around M3U generation and invalidation,
- mutexes around XMLTV writes,
- channel/session mutexes in `SessionManager`,
- lineup document mutexes documented in PR 01C,
- worker-pool state and futures,
- task scheduling and timers,
- database transactions and migration locks.

These locks protect a single process. They are not distributed coordination and
must not be interpreted as multi-node safety.

## Failure and Observability Concerns

The baseline must preserve and characterize:

- task failure propagation,
- worker crash and restart behavior,
- process exit and signal handling,
- FFmpeg stderr and exit-code handling,
- partial filesystem writes,
- retry and cancellation behavior,
- provider timeouts,
- startup task ordering,
- guide and cache refresh failures,
- session cleanup after client disconnect,
- logging without secret leakage.

## Characterization Gaps

- No background-category tests were identified by the path-based test
  classifier, despite tests existing for individual services.
- Task registration completeness and duplicate-ID behavior are not summarized by
  a single contract test.
- Worker and no-op worker behavioral equivalence is not established here.
- Recurring schedule recovery after downtime is not established here.
- Idempotency of manual task execution is not established here.
- File writes are not uniformly documented as atomic or replace-safe.
- Timer ownership and shutdown cancellation are not centrally documented.
- Static discovery cannot determine whether broad request candidates are actual
  outbound calls.

## Required Characterization Before Boundary Changes

- Task registry snapshot and unique-ID tests.
- Startup ordering and fail-fast/continue policy tests.
- Recurring-task restart and missed-run behavior.
- Worker/no-op worker parity fixtures.
- Cancellation and timeout tests.
- Atomicity and cleanup tests for generated files.
- Process spawn argument, termination, and orphan-process tests.
- Secret-redaction tests for provider and process errors.
- Graceful shutdown tests with active workers, streams, and file writes.
- Container restart tests that distinguish durable state from derived output.
- Explicit capability boundaries for future plugins.

## M01 Disposition

The inherited background runtime is reusable infrastructure but currently spans
providers, catalog maintenance, output generation, process execution, and
cleanup. Module-boundary work must assign each task to a domain owner while
retaining a narrow shared execution framework.
