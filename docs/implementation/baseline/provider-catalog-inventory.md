# Provider and Catalog Inventory

- **Source commit:** `49be6eec67247b5a3c43efaa928953bfd4c852dd`
- **Raw discovery SHA-256:** `f4fe004082aefe1281687a3262b3607fa119038949197a68f975367bb6058080`
- **Normalized discovery SHA-256:** `89c88fffcc9a0fdb1b8e92a901f2686bf648969f517aa8ce72159e0ed1d92f21`
- **Status:** Reviewed static baseline
- **Runtime behavior changed:** No

## Scope and Method

This inventory records the inherited provider and catalog boundary before
ChannelForge introduces its own Media Source and Catalog contracts. It combines
the sanitized PR 01D discovery capture with source review of the provider
clients, media-source scanners, persistence seams, API entry points, and
normalization repositories.

The raw collector is intentionally broad. Its path and identifier rules can
produce false positives, so candidate counts are evidence-search aids rather
than claims of semantic ownership.

## Static Discovery Summary

| Measure | Count |
| --- | --- |
| Provider candidate files | 138 |
| Catalog candidate files | 42 |
| Provider-related route candidates | 54 |
| Catalog-related route candidates | 2 |
| Provider-characterization test candidates | 4 |
| Catalog-characterization test candidates | 3 |
| Provider environment-key references | 0 |

## Provider Boundary Map

| Provider | Current client or scanner authority | Observed responsibilities | Disposition |
| --- | --- | --- | --- |
| Plex | `server/src/external/plex/PlexApiClient.ts`; Plex scanner and canonicalizer services | Connection, libraries, item enumeration, collections, playlists, metadata mapping, playback reporting, stream details | Preserve behind a future provider adapter |
| Jellyfin | `server/src/external/jellyfin/JellyfinApiClient.ts`; Jellyfin scanner services | Connection, libraries, item enumeration, genres, metadata mapping, subtitle retrieval, playback reporting | Preserve behind a future provider adapter |
| Emby | `server/src/external/emby/EmbyApiClient.ts`; Emby scanner services | Connection, libraries, item enumeration, metadata mapping, subtitle retrieval, session/playback reporting | Preserve behind a future provider adapter |
| Local media | `server/src/db/LocalMediaDB.ts`; `server/src/services/local/`; local scanner/canonicalizer services | Filesystem-backed library records, fallback/NFO metadata, local paths, local media normalization | Preserve as a first-party adapter without pretending it is a remote server |

The shared scanner abstraction is currently
`server/src/services/scanner/MediaSourceScanner.ts`. It owns scan state,
provider-client acquisition, scan cancellation, library completion timestamps,
and external-subtitle localization. Provider-specific scanners remain coupled
to inherited persistence models and provider-specific API clients.

## Current Media-Source Persistence Seam

| Concept | Current authority | Observed role |
| --- | --- | --- |
| Media source | `server/src/db/schema/MediaSource.ts` | Provider identity, type, connection metadata, and source-level settings |
| Library | `server/src/db/schema/MediaSourceLibrary.ts` | Enabled provider library and scan state |
| Path replacement | `server/src/db/schema/MediaSourceLibraryReplacePath.ts` | Provider-path to local-path translation |
| Local media folder | `server/src/db/schema/LocalMediaFolder.ts` | Local library grouping |
| Local source path | `server/src/db/schema/LocalMediaSourcePath.ts` | Filesystem source roots and local mappings |
| Repository writes | `server/src/db/mediaSourceDB.ts`; `server/src/db/LocalMediaDB.ts` | Current source, library, path, and scan-state mutation |

These shapes are inherited implementation state. They are not yet the accepted
ChannelForge Media Source domain.

## Catalog Normalization Seam

The current system normalizes provider items into shared program and grouping
records rather than keeping every provider response as the playback authority.

| Area | Current authority | Observed role |
| --- | --- | --- |
| Program upsert | `server/src/db/program/ProgramUpsertRepository.ts` | Creates or updates normalized programs and related records |
| External identifiers | `server/src/db/program/ProgramExternalIdRepository.ts` | Maps normalized programs to provider and metadata identifiers |
| Program grouping | `ProgramGroupingRepository.ts` and `ProgramGroupingUpsertRepository.ts` | Shows, seasons, artists, albums, and grouping relationships |
| Program metadata | `server/src/db/program/ProgramMetadataRepository.ts` | Artwork, genres, credits, and metadata relations |
| Program search | `server/src/db/program/ProgramSearchRepository.ts`; `MeilisearchService.ts` | Search projection and query boundary |
| Program state | `server/src/db/program/ProgramStateRepository.ts` | Program-level inherited state |
| Media files and streams | `ProgramMediaFile.ts`; `ProgramMediaStream.ts`; `ProgramVersion.ts` | Playback-relevant normalized media representation |

The current catalog still exposes provider-specific identifiers and types in
shared packages. Milestone 05 must define a stable ChannelForge Catalog Item,
Source Binding, and Playback Variant model before inherited tables are replaced.

## Provider API Entry Points

| Route group | Representative inherited routes | Current purpose |
| --- | --- | --- |
| Media sources | `GET/POST /media-sources`; scan, refresh, library, status, update, and delete routes | Source lifecycle and synchronization |
| Plex | `/plex/:mediaSourceId/...` | Libraries, search, collections, playlists, filters, tags, and children |
| Jellyfin | `/jellyfin/:mediaSourceId/...` | Login, libraries, genres, and item enumeration |
| Emby | `/emby/:mediaSourceId/...` | Login, libraries, and item enumeration |
| Settings | `GET/PUT /settings/media-source`; `/plex-settings` | Inherited provider settings |
| Debug | `/debug/media_sources/...`; `/jellyfin/...` debug routes | Manual scan and provider inspection |

PR 01D does not change these routes. API migration remains deferred to
Milestone 09 and must preserve compatibility deliberately.

## Synchronization and Background Work

The static inventory identifies provider-related work in:

- `RefreshMediaSourceLibraryTask`
- `UpdatePlexPlayStatusTask`
- `UpdateJellyfinPlayStatusTask`
- media-source scan and progress services
- startup library refresh
- dangling-program and duration-reconciliation tasks
- catalog backfill/fixer tasks

The current task system and worker pool are shared with non-provider work.
Provider refresh and playback-reporting failures therefore need contract tests
at the adapter boundary rather than direct dependence on task implementation
details.

## Current Characterization Coverage

Observed high-signal provider and catalog tests include:

- `server/src/external/plex/PlexApiClient.test.ts`
- `server/src/services/PlexMediaCanonicalizers.test.ts`
- `server/src/services/LocalMediaCanonicalizer.test.ts`
- `server/src/services/search/MediaSourceNameSearchMutator.test.ts`
- `server/src/services/local/FallbackMetadataService.test.ts`
- `server/src/services/local/localMetadataUtil.test.ts`

This is useful but incomplete. The discovery capture did not identify equivalent
high-signal client tests for Jellyfin and Emby, nor a complete cross-provider
normalization contract suite.

## Compatibility and Migration Risks

1. **Provider response leakage.** Provider-specific response types appear in
   shared packages and service signatures.
2. **Identity coupling.** Program identity depends on inherited external-ID
   records and provider-specific keys.
3. **Scan/write coupling.** Scanners directly interact with inherited
   repositories and subtitle download behavior.
4. **Path translation.** Direct-path and replacement-path behavior can change
   whether playout uses local files or remote provider URLs.
5. **Playback reporting.** Plex and Jellyfin play-status tasks are background
   side effects that must not influence schedule planning.
6. **Deletion semantics.** Source deletion can affect normalized programs,
   groupings, search projections, lineups, and playback references.
7. **Secret handling.** Static discovery records key names and code locations,
   not configured provider tokens or URLs. Secret migration requires separate
   review.
8. **Provider parity.** Plex, Jellyfin, Emby, and local media do not expose
   identical metadata or playback capabilities.

## Required Characterization Before Replacement

- Contract fixtures for connection, library enumeration, pagination, and errors
  for Plex, Jellyfin, and Emby.
- Stable normalization tests proving equivalent canonical output from
  semantically equivalent provider items.
- Source-binding tests for duplicate IDs, changed provider IDs, missing items,
  and source deletion.
- Direct-path and path-replacement tests on Linux and Windows path forms.
- Subtitle retrieval and cache-localization tests.
- Scan cancellation, retry, progress, and partial-failure tests.
- Playback-reporting tests that prove failures do not interrupt playout.
- Local-media metadata fallback tests for movies, episodes, music, music videos,
  and other videos.
- Migration tests that keep inherited source and program records readable until
  controlled cutover.

## M01 Disposition

The inherited provider and catalog runtime is sufficiently identified to begin
contract design, but it is not ready for broad renaming or replacement. The
next architectural step is to place these implementations behind explicit
ChannelForge-owned interfaces while preserving current behavior.
