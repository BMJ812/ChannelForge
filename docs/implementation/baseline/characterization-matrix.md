# Provider, Scheduling, and Playout Characterization Matrix

- **Source commit:** `49be6eec67247b5a3c43efaa928953bfd4c852dd`
- **Raw discovery SHA-256:** `f4fe004082aefe1281687a3262b3607fa119038949197a68f975367bb6058080`
- **Normalized discovery SHA-256:** `89c88fffcc9a0fdb1b8e92a901f2686bf648969f517aa8ce72159e0ed1d92f21`
- **Status:** Reviewed M01 characterization plan
- **Runtime behavior changed:** No

## Purpose

This matrix turns PR 01D inventory findings into explicit characterization
requirements. It does not claim that every listed behavior is currently
covered. Existing tests are evidence anchors; the required additions define the
minimum safety net before architectural replacement.

## Evidence Summary

| Area | Static candidate files | Test candidates | M01 assessment |
| --- | --- | --- | --- |
| Providers | 138 | 4 | Partial coverage; provider parity incomplete |
| Catalog | 42 | 3 | Partial normalization coverage |
| Scheduling | 206 | 13 | Substantial service tests; determinism contract incomplete |
| Interstitials | 48 | 2 | Filler-focused coverage; concept split incomplete |
| Playout | 115 | 20 | Strong unit coverage; end-to-end contract gaps remain |
| FFmpeg | 257 | 47 | Broad builder tests; host-dependent integration coverage |
| Outputs | 53 | 6 | Guide/XMLTV/HLS tests; M3U/HDHR gaps |
| Background runtime | 102 | 0 | Cross-cutting coverage not classified centrally |
| External feeds | 0 | 0 | No verified inherited runtime implementation |

## Characterization Matrix

| Boundary | Behavior to freeze | Existing evidence anchor | Required addition | Risk |
| --- | --- | --- | --- | --- |
| Plex client | Connection, pagination, libraries, collections, playlists, metadata, errors | `PlexApiClient.test.ts` | Recorded contract fixtures including timeout, auth failure, malformed response, and pagination | High |
| Jellyfin client | Connection, libraries, item enumeration, genres, subtitles, play reporting | Source/API inventory | Client contract suite equivalent to Plex coverage | High |
| Emby client | Connection, libraries, item enumeration, subtitles, play reporting | Source/API inventory | Client contract suite equivalent to Plex coverage | High |
| Local media | Canonical identity, NFO/fallback metadata, path handling | `LocalMediaCanonicalizer.test.ts`; local metadata tests | Windows/Linux path fixtures, missing metadata, moved files, duplicate files | High |
| Provider normalization | Equivalent provider items produce stable normalized catalog records | `PlexMediaCanonicalizers.test.ts` | Cross-provider canonical fixture suite | Critical |
| Source identity | External IDs, source bindings, rescan, deletion, and reappearance | Program repository tests outside this classifier | Golden lifecycle tests across all providers | Critical |
| Library scan | Progress, cancellation, partial failure, retry, last-scanned timestamp | Scanner source and media-source API tests | Scanner state-machine contract suite | High |
| Time-slot scheduling | Anchoring, padding, flex, ordering, duration packing | `TimeSlotService.test.ts` | Golden outputs for boundary times and catalog mutations | Critical |
| Random-slot scheduling | Weights, ordering, seed, reruns, empty candidates | `RandomSlotsService.test.ts` | Same-input/same-seed golden contract and stable-ordering tests | Critical |
| Schedule time zones | UTC, local zones, DST transitions, non-hour offsets | `TimeSlotService.test.ts` with `TZ` references | Explicit cross-zone golden fixtures | Critical |
| Lineup persistence | JSON shape, migration, read/write, soft deletion, compatibility | `ChannelLineupMigrator.test.ts`; PR 01C inventory | Round-trip and old-version fixture matrix | Critical |
| Redirect scheduling | Target identity, duration, missing targets, cycles | Scheduling and stream calculator tests | Planning-time and runtime redirect contract fixtures | High |
| Filler selection | Weights, duration preference, cooldown, decay, recovery, history | `FillerPickerV2.test.ts` | Golden selection sequences with stable seed and play history | Critical |
| Flex behavior | Merge, split, head/tail padding, filler conversion, offline output | Time-slot tests and UI flex tests | Service-level golden fixtures | High |
| Mid-roll breaks | Break points, duration, short content, exact boundaries | `midRollUtil.test.ts` | End-to-end schedule and guide fixtures | High |
| Current-item calculation | Channel start, wrap, offsets, slack, item boundaries | `StreamProgramCalculator.test.ts` | Golden timestamp matrix shared with guide calculations | Critical |
| Runtime redirects | Cycle detection, duration clipping, missing target fallback | `StreamProgramCalculator.test.ts` | Multi-hop and boundary-duration fixtures | Critical |
| Fallback/offline/error | Selection precedence and recovery | Stream calculator and stream API tests | Full fallback matrix including unavailable media and FFmpeg failure | Critical |
| Session lifecycle | Create, reuse, connection tracking, stale cleanup, stop, error | `SessionManager.test.ts`; `ConnectionTracker.test.ts` | Restart and concurrent-client contract tests | Critical |
| HLS sessions | Segments, discontinuities, playlist mutation, cleanup | HLS session and mutator tests | Concurrent clients, long-running sessions, interrupted process fixtures | High |
| MPEG-TS/concat | Continuity, child-session ownership, disconnect cleanup | Stream/session tests | End-to-end concat fixtures | High |
| Stream selection | Audio/subtitle rule evaluation and defaults | `StreamSelectionEvaluator.test.ts`; `SubtitleStreamPicker.test.ts` | Provider/container/codec matrix | High |
| FFmpeg planning | Direct, remux, transcode, filters, scaling, hardware choices | Builder and pipeline tests | Golden command representation independent of executable paths | Critical |
| FFmpeg execution | Spawn, exit, timeout, termination, stderr, cleanup | Integration helper and local tests | Linux CI integration suite with software path | Critical |
| M3U output | Channel order, IDs, logos, stealth, stream mode, cache | Source review | Golden M3U fixtures and cache-invalidation tests | High |
| XMLTV output | Times, metadata, flex, redirects, artwork, replacement | `XmlTvWriter.test.ts`; `TvGuideService.test.ts` | DST and runtime/guide alignment fixtures | Critical |
| HDHomeRun output | Discovery, tuner count, device XML, lineup, SSDP | API/source inventory | Contract fixtures exercised by supported media-server setup | High |
| Background tasks | Registration, scheduling, restart, manual run, failure | Individual service tests | Task registry and worker contract suite | High |
| Worker pool | Serialization, cancellation, crash, fallback parity | Worker implementation source | Worker/no-op parity and crash-recovery tests | High |
| External feeds | Discovery cannot become playable without authorization and source binding | Architecture specifications only | Negative tests when implementation begins | Critical |

## Platform Matrix

| Platform | Required validation | Authority |
| --- | --- | --- |
| Linux container | Build, unit tests, FFmpeg software path, guide, M3U, HDHR, session cleanup | Release authority |
| Unraid | Container paths, permissions, device mapping, upgrade, backup, restore | Deployment wrapper validation |
| Windows development | Build and classified unit tests; path and SQLite locking failures recorded | Developer compatibility |
| macOS development | Build, software FFmpeg, VideoToolbox where available | Developer compatibility |
| Nvidia | Capability detection, decode/encode/filter chain, device mapping | Optional hardware profile |
| VAAPI | Device discovery, driver selection, decode/encode/filter chain | Optional hardware profile |
| Intel Quick Sync | Capability detection and pipeline selection | Optional hardware profile |

## Evidence Rules

- Golden fixtures must record inputs, stable identifiers, seed, time zone, and
  expected output.
- Tests must not depend on unordered database or provider results.
- Host-specific paths and executable versions must be normalized where they are
  not semantically relevant.
- External provider fixtures must be sanitized and must not contain user tokens,
  server URLs, library names, or private media metadata.
- Local integration tests must remain separate from release-authoritative Linux
  validation.
- A replacement boundary cannot remove inherited coverage until equivalent
  ChannelForge-owned tests pass.
- Flaky timing tests are failures to characterize, not acceptable baseline
  variance.

## Exit Criteria for M01 Characterization

PR 01D itself records the matrix; it does not implement every missing test.
Milestone 01 completion requires that the high-risk inherited behaviors needed
for Milestone 02 boundary work are either:

1. covered by existing tests,
2. covered by added characterization tests, or
3. explicitly deferred with an owner, target milestone, and reason.

No architectural replacement should proceed based only on static candidate
counts.
