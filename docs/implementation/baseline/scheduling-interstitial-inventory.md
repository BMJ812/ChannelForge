# Scheduling and Interstitial Inventory

- **Source commit:** `49be6eec67247b5a3c43efaa928953bfd4c852dd`
- **Raw discovery SHA-256:** `f4fe004082aefe1281687a3262b3607fa119038949197a68f975367bb6058080`
- **Normalized discovery SHA-256:** `89c88fffcc9a0fdb1b8e92a901f2686bf648969f517aa8ce72159e0ed1d92f21`
- **Status:** Reviewed static baseline
- **Runtime behavior changed:** No

## Scope and Method

This document records inherited schedule construction, lineup persistence,
filler/flex behavior, and interstitial-related seams before ChannelForge
introduces deterministic network planning.

The evidence is static. It identifies likely ownership and test surfaces, but it
does not prove that the same inputs always produce the same schedule at runtime.

## Static Discovery Summary

| Measure | Count |
| --- | --- |
| Scheduling candidate files | 206 |
| Interstitial candidate files | 48 |
| Scheduling route candidates | 26 |
| Scheduling test candidates | 13 |
| Interstitial test candidates | 2 |
| Raw randomness sites | 13 |
| Scheduling migration candidates | 6 |

## Current Scheduling Entry Points

| Entry point | Current authority | Observed role |
| --- | --- | --- |
| Channel programming read/write | `GET/POST /channels/:id/programming` | Retrieves and replaces inherited lineup programming |
| Time-slot schedule | `POST /channels/:channelId/schedule-time-slots` | Materializes a time-slot request into channel programming |
| Random-slot schedule | `POST /channels/:channelId/schedule-slots` | Materializes weighted/random slot programming |
| Schedule read | `GET /channels/:id/schedule` | Returns materialized schedule state |
| Lineup read | `GET /channels/:id/lineup`; `/channels/all/lineups` | Exposes persisted lineup documents |
| Worker requests | `server/src/types/worker_schemas.ts` | Carries slot scheduling work through the worker boundary |

The scheduling APIs are first-party mutation endpoints. PR 01D does not alter
their request or response shapes.

## Scheduling Service Map

| Area | Current authority | Observed role |
| --- | --- | --- |
| Time slots | `TimeSlotSchedulerService.ts`; `TimeSlotService.ts` | Time-anchored slot materialization and padding/flex behavior |
| Random slots | `RandomSlotSchedulerService.ts`; `RandomSlotsService.ts` | Weighted/random slot materialization |
| Shared slot machinery | `SlotSchedulerHelper.ts`; `slotSchedulerUtil.ts` | Program mapping, iterator selection, filler insertion, flex distribution, and slot assembly |
| Program iteration | `ProgramIterator.ts` and specialized iterator classes | Sequential, replay, rerun, ordered, shuffle, and chunked-shuffle traversal |
| Lineup persistence | `server/src/db/channel/LineupRepository.ts` | Per-channel lineup document reads and writes |
| Materialization commands | `MaterializeLineupCommand.ts`; `RegenerateChannelLineupCommand.ts`; `GetMaterializedChannelScheduleCommand.ts` | Command-layer schedule and lineup operations |
| General task scheduler | `server/src/services/Scheduler.ts`; `ScheduledTask.ts` | Background job timing, not television schedule planning |

## Current Slot Vocabulary

Source review of `slotSchedulerUtil.ts` identifies inherited slot identities for:

- movies
- shows
- artists
- custom shows
- filler lists
- redirects
- smart collections
- flex

The utility constructs a program map, creates specialized iterators, and
materializes content, filler, redirect, and flex items. This is a useful
implementation seam, but it mixes selection, ordering, duration packing, and
output-item construction.

ChannelForge must separate:

1. schedule inputs,
2. deterministic planning,
3. decision evidence,
4. approved plan storage, and
5. runtime playout interpretation.

## Randomness and Determinism

The collector found 13 raw randomness sites across the scanned repository.
High-signal scheduling locations include:

- `slotSchedulerUtil.ts`
- `WeightedFillerProgramIterator.ts`
- `FillerPickerV2.ts` and its tests
- shuffle and chunked-shuffle iterators
- slot-service tests that exercise seeded or mocked randomness

The scheduling code accepts `random-js` objects in several seams, which is
better than unrestricted global randomness. However, PR 01D does not establish:

- a single canonical seed contract,
- stable ordering before random selection,
- deterministic UUID generation,
- deterministic behavior across Node or dependency versions,
- stable behavior when catalog ordering changes,
- complete evidence explaining each choice.

Milestone 07 must define those contracts before the inherited scheduler is
replaced or presented as ChannelForge-deterministic.

## Filler, Flex, and Interstitial Baseline

| Concept | Current authority | Observed behavior |
| --- | --- | --- |
| Filler lists | `FillerListDB.ts`; `fillerListsApi.ts` | Named collections of programs available for filler selection |
| Channel filler assignment | `ChannelFillerShow.ts` | Associates filler lists with channels and inherited weights/cooldowns |
| Filler selection | `FillerPickerV2.ts`; `WeightedFillerProgramIterator.ts` | Selects content using duration, ordering, decay/recovery, and history-related inputs |
| Flex | `FlexProgramIterator.ts`; slot utilities; lineup schemas | Represents unscheduled or padded time and may be converted to filler/offline behavior |
| Mid-roll breaks | `midRollBreakRules.ts`; `midRollUtil.test.ts` | Resolves break points and durations inside eligible content |
| Commercial lineup item | `StreamLineup.ts`; `StreamProgramCalculator.ts` | Distinguishes filler-backed playback from normal program playback |
| Play history | `ProgramPlayHistoryDB.ts` | Records played programs and filler-list context for runtime decisions |

The inherited term **filler** covers several behaviors that ChannelForge plans
to separate into Presentation Assets, Interstitial Pools, Break Rules, and
fallback/offline presentation. The migration must preserve behavior while
removing the semantic ambiguity.

## External Feed Baseline

The path-based collector found **0** external-feed implementation candidates.
Content signals for YouTube, RSS, Atom, BumpWorthy, and web video were found in
architecture, roadmap, README, documentation, and test/legacy fixtures—not in a
recognized runtime feed adapter.

This supports the current architecture statement that External Feeds are
planned work, not an inherited playable-feed subsystem. It is still a static
finding, not proof that no generic HTTP path could accept a remote URL.

PR 01D therefore records:

- no verified YouTube downloader,
- no verified YouTube stream extractor,
- no verified BumpWorthy scraper,
- no verified RSS/Atom ingestion service,
- no verified Discovery Inbox implementation,
- no authorization or playability gate for external feed items.

Those capabilities remain deferred to Milestones 05, 06, 07, 08, and 09 under
ADR 0002 and specification 15.

## Existing Characterization Coverage

High-signal server tests include:

- `RandomSlotsService.test.ts`
- `TimeSlotService.test.ts`
- `FillerPickerV2.test.ts`
- `midRollUtil.test.ts`
- `slotGroupValidator.test.ts`
- `schedulingUtil.test.ts`
- `ChannelLineupMigrator.test.ts`

UI-level programming-operation tests cover adding flex, padding, breaks,
sorting, and duplicate removal. UI tests do not replace service-level
determinism and persistence tests.

## Compatibility and Migration Risks

1. **Mixed concerns.** Slot utilities combine candidate selection, ordering,
   packing, flex, filler, and output-item creation.
2. **Persisted lineup authority.** Per-channel JSON lineup documents are a live
   runtime authority and cannot be replaced without compatibility reads.
3. **Randomness drift.** Seed, input ordering, UUID generation, and library
   ordering can change output.
4. **Time-zone sensitivity.** Scheduling tests reference `TZ`; DST and local
   calendar behavior require explicit characterization.
5. **Duration arithmetic.** Millisecond rounding, slack, padding, and mid-roll
   packing can create accumulated drift.
6. **Redirect cycles.** Redirects are schedule items and can become runtime
   recursion hazards.
7. **Filler semantics.** Filler, flex, offline, fallback, commercial, and
   presentation concepts overlap.
8. **History dependence.** Cooldowns and play history can make output depend on
   mutable runtime state.
9. **Migration coupling.** Lineup migrations and current APIs assume inherited
   JSON shapes.
10. **Worker boundary.** Schedule requests can cross the worker pool, so
    serialization and cancellation behavior matter.

## Required Characterization Before Replacement

- Golden schedule fixtures for time-slot and random-slot requests.
- Same-input/same-seed determinism tests, including stable candidate ordering.
- DST spring-forward, DST fall-back, UTC, and non-hour-offset time-zone tests.
- Empty, one-item, duplicate, missing-item, and changed-duration catalogs.
- Redirect cycle and missing-target behavior.
- Filler cooldown, weight, decay, recovery, and duration-packing tests.
- Mid-roll break placement and exact-duration boundary tests.
- Flex insertion, merge, head/tail padding, and offline fallback tests.
- Lineup JSON compatibility and migration round trips.
- Worker and in-process scheduling equivalence.
- Decision-evidence fixtures suitable for later ChannelForge plan explanations.
- Explicit tests proving external feed discoveries cannot enter planning without
  a supported playable source.

## M01 Disposition

The inherited scheduler is feature-rich and partially test-covered, but its
current design is not the final ChannelForge planning model. It must be wrapped
and characterized before deterministic plan generation is introduced.
