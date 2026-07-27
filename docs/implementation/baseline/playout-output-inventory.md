# Playout and Output Inventory

- **Source commit:** `49be6eec67247b5a3c43efaa928953bfd4c852dd`
- **Raw discovery SHA-256:** `f4fe004082aefe1281687a3262b3607fa119038949197a68f975367bb6058080`
- **Normalized discovery SHA-256:** `89c88fffcc9a0fdb1b8e92a901f2686bf648969f517aa8ce72159e0ed1d92f21`
- **Status:** Reviewed static baseline
- **Runtime behavior changed:** No

## Scope and Method

This inventory records the inherited runtime path from a published lineup item
to a client-visible stream, guide, playlist, or HDHomeRun-compatible response.

It covers playout selection, stream sessions, FFmpeg orchestration, fallback and
redirect handling, HLS/MPEG-TS output, XMLTV, M3U, HDHomeRun, and SSDP. Static
discovery is supplemented by source review of the central runtime services.

## Static Discovery Summary

| Measure | Count |
| --- | --- |
| Playout candidate files | 115 |
| FFmpeg candidate files | 257 |
| Output candidate files | 53 |
| Playout route candidates | 35 |
| Output route candidates | 27 |
| Playout test candidates | 20 |
| FFmpeg test candidates | 47 |
| Output test candidates | 6 |
| Raw process-spawn sites | 21 |
| Raw filesystem-write sites | 17 |

## Runtime Playout Flow

The current high-level path is:

1. A stream API route resolves the requested channel and stream mode.
2. `SessionManager` obtains or creates a session for the channel and session
   type under a channel-scoped mutex.
3. `StreamProgramCalculator` resolves the current lineup item for the request
   timestamp.
4. Redirects are followed with recursive-cycle detection.
5. Content, commercial/filler, fallback, offline, redirect, or error items are
   converted into runtime stream-lineup items.
6. Stream-details services resolve provider or local media paths and available
   tracks.
7. stream-selection rules select audio and subtitle actions.
8. `FfmpegStreamFactory` and pipeline builders create direct-play, remux, or
   transcode execution.
9. HLS or concat session classes manage generated media, playlists,
   connections, staleness, and cleanup.
10. API clients receive MPEG-TS, HLS, native-playback metadata, or playlist
    responses.

This is the inherited runtime. ChannelForge planning must publish an approved
plan before playout reaches this path.

## Current Program Selection Authority

`server/src/stream/StreamProgramCalculator.ts` is a central runtime authority.

Source review confirms that it:

- loads the channel and lineup,
- repairs a nonpositive stored channel duration from lineup contents,
- determines the current item from channel start time, duration, and timestamp,
- follows channel redirects,
- rejects recursive redirect chains,
- converts missing redirect targets to an error/offline-style item,
- optionally skips negligible offline slack,
- resolves content records lazily,
- distinguishes normal programs and filler-backed commercial items,
- records play history,
- applies repeated-attempt throttling.

This class performs runtime selection. It must not become the ChannelForge
planning authority.

## Session Authority

`server/src/stream/SessionManager.ts` owns an in-process map keyed by channel
and session type. Source review identifies session types for HLS, direct HLS,
slower HLS, MPEG-TS/concat, and HLS wrappers.

The manager currently:

- serializes session creation and teardown with a mutex map,
- reuses compatible sessions,
- creates sessions from channel and transcode configuration,
- tracks connection events,
- propagates errors and stop events,
- cleans stale sessions,
- shuts down child sessions,
- integrates on-demand channel pause behavior,
- reads a configurable session-staleness value.

Session state is process-local. Restart, multi-process, and future multi-node
behavior therefore require explicit constraints.

## Stream and Playback API Surface

| Area | Representative inherited routes | Current role |
| --- | --- | --- |
| Channel streams | `/stream/channels/:id`; `.ts`; `radio.ts`; item stream; session file routes | Primary live channel delivery |
| HLS | `/stream/channels/:id.m3u8`; HLS session-file routes | Playlist and segmented stream delivery |
| Native playback | `GET /channels/:id/native-playback` | Returns client-readable current playback information |
| Sessions | `GET /sessions`; channel session list and delete routes | Runtime session inspection and termination |
| Stream selection | `/stream-selection-profiles` and expression validation | Audio/subtitle selection rules |
| Transcode profiles | `/transcode_configs`; `/ffmpeg-settings` | FFmpeg and per-channel transcode configuration |
| Debug | `/streams/...`; FFmpeg probe/capabilities; stream logs | Operational inspection |

PR 01D does not change these routes or their compatibility behavior.

## FFmpeg Boundary

The FFmpeg subtree is the largest identified runtime surface: 257 static
candidate files, including builders, capability detection, decoders, encoders,
filters, formats, pipeline state, stream selection, process control, and
integration fixtures.

High-confidence process boundaries include:

- `server/src/ffmpeg/FfmpegProcess.ts`
- `server/src/ffmpeg/ffmpegText.ts`
- `server/src/ffmpeg/GetLastPtsDuration.ts`
- FFmpeg integration helpers
- hardware-capability helper processes

The current implementation supports software and hardware-specific pipeline
construction, including Nvidia, VAAPI, Intel Quick Sync, and VideoToolbox
related paths. Capability availability and actual command lines depend on the
host, configured profile, input streams, and runtime detection.

Milestone 08 must preserve FFmpeg behind an explicit playout adapter. Plugins
must never receive unrestricted process execution.

## Stream Selection and Transcoding

Current seams include:

- `StreamSelectionEvaluator.ts`
- `SubtitleStreamPicker.ts`
- `FfmpegPlaybackParamsCalculator.ts`
- `FfmpegStreamFactory.ts`
- `ProgramStreamDetailsFetcher.ts`
- provider-specific and local stream-detail fetchers
- transcode and stream-selection persistence schemas

The system can choose audio/subtitle streams and decide among direct,
remux-like, and transcoded paths. Static evidence does not establish a complete
capability matrix for every provider, container, codec, subtitle type, and
hardware accelerator.

## Fallback, Offline, and Redirect Behavior

| Runtime item | Current interpretation |
| --- | --- |
| Program | Content-backed media selected from the current lineup position |
| Commercial | Filler-list-backed content distinguished for history and runtime behavior |
| Flex/offline | Time without normal content; may show fallback media or an offline/error presentation |
| Fallback | Channel-level fallback content used when normal content cannot play or the channel is offline |
| Redirect | Runtime delegation to another channel with cycle detection and duration bounds |
| Error | Synthetic timed item used when selection or target resolution fails |

ChannelForge must preserve these runtime outcomes while mapping them to clearer
published-plan and Presentation Asset concepts.

## M3U/IPTV Output

Source review of `server/src/services/M3UService.ts` confirms that the current
service:

- sorts channels by number,
- omits stealth channels,
- emits XMLTV references,
- emits a channel stream URL with the configured stream mode,
- caches a host-template M3U document,
- serializes generation and invalidation with a mutex,
- retains inherited Tunarr fallback names and image paths.

M3U is derived output, not authoritative schedule state.

## XMLTV Output

Source review of `server/src/services/XmlTvWriter.ts` confirms that the writer:

- serializes writes with a mutex,
- generates XMLTV channel and programme records,
- writes to the configured XMLTV output path,
- includes titles, subtitles, descriptions, ratings, dates, genres, episode
  numbers, and artwork where available,
- represents flex and redirects in guide output,
- retains inherited Tunarr generator and image identifiers.

The guide and XMLTV pipeline must be characterized for time boundaries,
redirects, filler visibility, stealth channels, and artwork failures.

## HDHomeRun-Compatible Output and SSDP

Current components include:

- `hdhrApi.ts`
- `hdhrSettingsApi.ts`
- `HDHRService.ts`
- `node-ssdp`
- `/device.xml`
- `/discover.json`
- `/lineup.json`
- `/lineup_status.json`

Source review confirms inherited Tunarr identity in SSDP signatures and device
metadata. Branding replacement is intentionally deferred until compatibility
and deployment behavior are characterized.

## Output Contract Map

| Output | Current authority | Derived from | Compatibility concern |
| --- | --- | --- | --- |
| M3U | `M3UService.ts` | Channels and stream modes | URL, numbering, IDs, logos, stealth channels, cache invalidation |
| XMLTV | `TvGuideService.ts`; `XmlTvWriter.ts` | Channels and materialized guide items | Times, titles, redirects, flex, artwork, file replacement |
| HDHomeRun discovery | `HDHRService.ts`; `hdhrApi.ts` | Settings and server address | Device identity, tuner count, SSDP, Plex/Jellyfin discovery |
| HLS | HLS session and playlist classes | Runtime selected stream | Segment continuity, discontinuities, cleanup, stale sessions |
| MPEG-TS/concat | Concat session classes | Runtime selected stream | Connection reuse, timing, discontinuity, process lifetime |
| Native playback | `nativePlaybackApi.ts` | Current lineup item and media details | Client contract and provider path behavior |

## Existing Characterization Coverage

High-signal tests include:

- `StreamProgramCalculator.test.ts`
- `SessionManager.test.ts`
- `ConnectionTracker.test.ts`
- `BaseHlsSession.test.ts`
- `HlsSession.test.ts`
- `streamApi.test.ts`
- `nativePlaybackApi.test.ts`
- `FfmpegStreamFactory.test.ts`
- `FfmpegPlaybackParamsCalculator.test.ts`
- `StreamSelectionEvaluator.test.ts`
- `SubtitleStreamPicker.test.ts`
- HLS playlist mutator tests
- XMLTV and TV-guide tests
- hardware pipeline and capability tests

Several FFmpeg integration tests are marked as local or depend on fixture
binaries and hardware. Their availability must be recorded per platform.

## Compatibility and Migration Risks

1. **Runtime/planning coupling.** Current lineup documents are interpreted
   directly during playback.
2. **Process-local sessions.** Session state is not a durable or distributed
   authority.
3. **FFmpeg command risk.** Process execution, paths, filters, and hardware
   capabilities are security- and platform-sensitive.
4. **Time arithmetic.** Lineup wraparound, offsets, slack, redirect duration, and
   segment boundaries can drift.
5. **Provider path differences.** A program can resolve to local files, provider
   URLs, or external subtitle resources.
6. **Fallback ambiguity.** Offline, fallback, filler, commercial, and error
   presentations overlap.
7. **Output caching.** M3U and HLS caches require explicit invalidation.
8. **Inherited identity.** Output metadata and default image URLs still use
   Tunarr names.
9. **Guide divergence.** Guide generation and runtime selection use related but
   separate calculations.
10. **Client tolerance.** Plex, Jellyfin, Emby, and IPTV clients may rely on
    undocumented response details.

## Required Characterization Before Replacement

- Golden current-item calculations across lineup start, wrap, and boundary
  timestamps.
- Redirect chain, redirect duration, missing target, and cycle tests.
- Fallback/offline/error selection and recovery tests.
- Session reuse, stale cleanup, connection removal, and restart behavior.
- Direct play, remux, transcode, audio selection, subtitle selection, and
  unsupported-codec matrices.
- FFmpeg process termination, timeout, stderr, partial-output, and cleanup tests.
- HLS discontinuity, playlist mutation, segment retention, and concurrent-client
  tests.
- M3U output and cache-invalidation fixtures.
- XMLTV golden fixtures across time zones and DST changes.
- HDHomeRun discovery and lineup contract fixtures against supported media
  servers.
- Linux container validation with software transcoding and available hardware
  accelerator paths.
- Tests proving playout consumes approved published plans rather than invoking
  planning logic after Milestone 08 cutover.

## M01 Disposition

The inherited playout runtime contains substantial mature functionality and
test coverage. It should be retained behind ChannelForge-owned publication and
playout contracts rather than rewritten wholesale.
