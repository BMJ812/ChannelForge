# Persistence Write Authority

- **Source commit:** `0e5491f87259123a3cb085e3d2ba3844eda510d0`
- **Discovery evidence SHA-256:** `9957491ba89d96bcc67bdd17a8ab7be275618fa645ad021de7fa6c6347e322d9`
- **Status:** Reviewed static baseline

## Summary

| Measure | Count |
| --- | ---: |
| Raw database-write regex candidates | 365 |
| Candidates resolved to current tables | 175 |
| Unresolved or likely non-database candidates | 190 |
| Transaction-call candidates | 32 |
| Files containing transaction evidence | 13 |
| Filesystem-write candidates | 67 |
| Process-spawn candidates | 38 |

The raw write count is intentionally retained as evidence. General method names
such as `update` and `insert` produce false positives.
Only targets resolved to current Drizzle table symbols or table names are
treated as current-table writer evidence below.

## Current SQLite Writer Matrix

| Current table | Writer records | Writer modules | APIs observed | Transaction evidence in writer module | Risk |
| --- | ---: | --- | --- | --- | --- |
| `artwork` | 8 | `server/src/db/LocalMediaDB.ts`, `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/tasks/fixers/BackfillProgramArtworkFixer.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/tasks/fixers/BackfillProgramArtworkFixer.ts` | Transaction evidence present |
| `cached_image` | 2 | `server/src/services/cacheImageService.ts` | `kysely-write` | None found | No transaction evidence in writer module |
| `channel` | 16 | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/channel/LineupRepository.ts`, `server/src/db/TranscodeConfigDB.ts`, `server/src/migration/db/Migration1732969335_AddTranscodeConfig.ts`, `server/src/tasks/fixers/EnsureTranscodeConfigIds.ts` | `kysely-write`, `orm-write` | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/channel/LineupRepository.ts`, `server/src/db/TranscodeConfigDB.ts` | Transaction evidence present |
| `channel_filler_show` | 6 | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/FillerListDB.ts` | `orm-write` | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/FillerListDB.ts` | Transaction evidence present |
| `channel_programs` | 8 | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/channel/LineupRepository.ts`, `server/src/db/ChannelDB.test.ts` | `orm-write` | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/channel/LineupRepository.ts` | Transaction evidence present |
| `channel_subtitle_preferences` | 4 | `server/src/db/channel/BasicChannelRepository.ts` | `orm-write` | `server/src/db/channel/BasicChannelRepository.ts` | Transaction evidence present |
| `credit` | 3 | `server/src/db/program/ProgramMetadataRepository.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `custom_show` | 6 | `server/src/db/CustomShowDB.test.ts`, `server/src/db/CustomShowDB.ts` | `kysely-write`, `orm-write` | `server/src/db/CustomShowDB.ts` | Transaction evidence present |
| `custom_show_content` | 4 | `server/src/db/CustomShowDB.test.ts`, `server/src/db/CustomShowDB.ts` | `orm-write` | `server/src/db/CustomShowDB.ts` | Transaction evidence present |
| `external_collections` | 2 | `server/src/db/ExternalCollectionRepo.ts` | `orm-write` | None found | No transaction evidence in writer module |
| `filler_show` | 3 | `server/src/db/FillerListDB.ts` | `kysely-write`, `orm-write` | `server/src/db/FillerListDB.ts` | Transaction evidence present |
| `filler_show_content` | 3 | `server/src/db/FillerListDB.ts` | `kysely-write`, `orm-write` | `server/src/db/FillerListDB.ts` | Transaction evidence present |
| `genre` | 1 | `server/src/db/program/ProgramMetadataRepository.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `genre_entity` | 2 | `server/src/db/program/ProgramMetadataRepository.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `local_media_folder` | 3 | `server/src/db/LocalMediaDB.ts` | `orm-write` | None found | No transaction evidence in writer module |
| `media_source` | 8 | `server/src/db/CustomShowDB.test.ts`, `server/src/db/mediaSourceDB.ts`, `server/src/db/ProgramDB.test.ts` | `kysely-write`, `orm-write` | `server/src/db/mediaSourceDB.ts` | Transaction evidence present |
| `media_source_library` | 9 | `server/src/db/mediaSourceDB.ts`, `server/src/db/ProgramDB.test.ts` | `kysely-write`, `orm-write` | `server/src/db/mediaSourceDB.ts` | Transaction evidence present |
| `media_source_library_replace_path` | 3 | `server/src/db/mediaSourceDB.ts` | `orm-write` | `server/src/db/mediaSourceDB.ts` | Transaction evidence present |
| `program` | 10 | `server/src/db/ChannelDB.test.ts`, `server/src/db/CustomShowDB.test.ts`, `server/src/db/mediaSourceDB.ts`, `server/src/db/program/BasicProgramRepository.ts`, `server/src/db/program/ProgramStateRepository.ts`, `server/src/db/program/ProgramUpsertRepository.ts` (+2 more) | `kysely-write`, `orm-write` | `server/src/db/mediaSourceDB.ts`, `server/src/db/program/ProgramUpsertRepository.ts` | High review priority |
| `program_chapter` | 1 | `server/src/db/program/ProgramUpsertRepository.ts` | `orm-write` | `server/src/db/program/ProgramUpsertRepository.ts` | Transaction evidence present |
| `program_external_id` | 7 | `server/src/db/program/ProgramExternalIdRepository.ts`, `server/src/tasks/fixers/BackfillMediaSourceIdFixer.ts` | `kysely-write`, `orm-write` | `server/src/db/program/ProgramExternalIdRepository.ts` | Transaction evidence present |
| `program_grouping` | 6 | `server/src/db/mediaSourceDB.ts`, `server/src/db/program/ProgramGroupingUpsertRepository.ts`, `server/src/db/program/ProgramStateRepository.ts`, `server/src/tasks/fixers/BackfillMediaSourceIdFixer.ts` | `kysely-write`, `orm-write` | `server/src/db/mediaSourceDB.ts`, `server/src/db/program/ProgramGroupingUpsertRepository.ts` | Transaction evidence present |
| `program_grouping_external_id` | 6 | `server/src/db/program/ProgramGroupingUpsertRepository.ts`, `server/src/tasks/fixers/BackfillMediaSourceIdFixer.ts` | `kysely-write`, `orm-write` | `server/src/db/program/ProgramGroupingUpsertRepository.ts` | Transaction evidence present |
| `program_media_file` | 1 | `server/src/db/program/ProgramUpsertRepository.ts` | `orm-write` | `server/src/db/program/ProgramUpsertRepository.ts` | Transaction evidence present |
| `program_media_stream` | 1 | `server/src/db/program/ProgramUpsertRepository.ts` | `orm-write` | `server/src/db/program/ProgramUpsertRepository.ts` | Transaction evidence present |
| `program_play_history` | 6 | `server/src/db/ProgramPlayHistoryDB.ts` | `orm-write` | None found | High review priority |
| `program_subtitles` | 6 | `server/src/db/program/ProgramMetadataRepository.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `program_version` | 2 | `server/src/db/program/ProgramUpsertRepository.ts` | `orm-write` | `server/src/db/program/ProgramUpsertRepository.ts` | Transaction evidence present |
| `smart_collection` | 3 | `server/src/db/SmartCollectionsDB.ts` | `orm-write` | None found | No transaction evidence in writer module |
| `stream_selection_profiles` | 3 | `server/src/api/streamSelectionApi.ts` | `orm-write` | None found | No transaction evidence in writer module |
| `studio` | 2 | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/services/PlexMediaCanonicalizers.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `studio_entity` | 2 | `server/src/db/program/ProgramMetadataRepository.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `tag_relations` | 6 | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/TagRepo.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `tags` | 11 | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/TagRepo.ts`, `server/src/services/PlexMediaCanonicalizers.ts` | `orm-write` | `server/src/db/program/ProgramMetadataRepository.ts` | Transaction evidence present |
| `transcode_config` | 11 | `server/src/db/TranscodeConfigDB.ts`, `server/src/migration/db/Migration1732969335_AddTranscodeConfig.ts`, `server/src/tasks/fixers/EnsureTranscodeConfigIds.ts` | `kysely-write`, `orm-write` | `server/src/db/TranscodeConfigDB.ts` | Transaction evidence present |

## Transaction Evidence

| Module | Transaction-call candidates | Evidence locations |
| --- | ---: | --- |
| `server/src/db/channel/BasicChannelRepository.ts` | 4 | `transaction@120`, `transaction@214`, `transaction@327`, `transaction@407` |
| `server/src/db/channel/ChannelProgramRepository.ts` | 1 | `transaction@376` |
| `server/src/db/channel/LineupRepository.ts` | 2 | `transaction@387`, `transaction@778` |
| `server/src/db/CustomShowDB.ts` | 2 | `transaction@191`, `transaction@303` |
| `server/src/db/FillerListDB.ts` | 2 | `transaction@127`, `transaction@196` |
| `server/src/db/mediaSourceDB.ts` | 4 | `transaction@166`, `transaction@203`, `transaction@340`, `transaction@412` |
| `server/src/db/program/ProgramExternalIdRepository.ts` | 3 | `transaction@246`, `transaction@286`, `transaction@317` |
| `server/src/db/program/ProgramGroupingUpsertRepository.ts` | 2 | `transaction@125`, `transaction@144` |
| `server/src/db/program/ProgramMetadataRepository.ts` | 6 | `transaction@130`, `transaction@194`, `transaction@261`, `transaction@373`, `transaction@434`, `transaction@51` |
| `server/src/db/program/ProgramUpsertRepository.ts` | 2 | `transaction@202`, `transaction@85` |
| `server/src/db/TranscodeConfigDB.ts` | 1 | `transaction@120` |
| `server/src/migration/DirectMigrationProvider.ts` | 1 | `transaction@252` |
| `server/src/tasks/fixers/BackfillProgramArtworkFixer.ts` | 2 | `transaction@131`, `transaction@247` |

## JSON and Filesystem Writers

| Concept | Store | Current writer | Other writers | Transaction boundary | Risk |
| --- | --- | --- | --- | --- | --- |
| Application settings | `settings.json` | `SettingsDB` / LowDB | Settings APIs and CLI | LowDB file update only | No shared SQLite transaction |
| Channel lineup | `channel-lineups/{id}.json` | `LineupRepository` / LowDB | Direct JSON save path in the same repository | Per-file mutex and LowDB write | SQLite relationship writes are separate |
| Deleted lineup marker | `channel-lineups/{id}.json.bak` | `LineupRepository` | None found | Filesystem rename | Restore/error characterization required |
| Database backup | `db-*.bak` / configured backup path | Backup and migration services | Startup cleanup | Filesystem/SQLite backup operation | Cross-file consistency review required |
| XMLTV publication | Configured XMLTV output | XMLTV generation task/service | Refresh API/task scheduler | File generation boundary | Derived output |
| Uploaded images | `images/uploads` | Upload API | Cache/image services consume it | Filesystem copy only | Filename and cleanup behavior require review |
| Cache and stream artifacts | `cache` / `streams` | Runtime services | Cleanup endpoints/tasks | Service-specific | Derived but operationally significant |

## Filesystem Write Sites

| Module | Candidate operations | Candidate locations |
| --- | --- | --- |
| `scripts/generate-docs-script.ts` | `writeFile` | `line 40` |
| `server/scripts/bundle.ts` | `mkdirSync`, `writeFileSync` | `line 103`, `line 26` |
| `server/scripts/download-meilisearch.ts` | `mkdir`, `unlink` | `line 104`, `line 114`, `line 230` |
| `server/scripts/generateEnvModule.ts` | `writeFile` | `line 26` |
| `server/scripts/make-bin.ts` | `mkdir`, `rename`, `rm`, `writeFile` | `line 103`, `line 106`, `line 179`, `line 188`, `line 96` |
| `server/src/api/index.ts` | `copyFile`, `mkdir` | `line 199`, `line 207` |
| `server/src/bootstrap.ts` | `mkdir`, `unlink` | `line 43`, `line 49`, `line 65`, `line 98` |
| `server/src/cli/GenerateOpenApiCommand.ts` | `copyFile`, `rm`, `writeFile` | `line 56`, `line 60`, `line 62` |
| `server/src/db/backup/ArchiveDatabaseBackup.ts` | `mkdir`, `rm` | `line 153`, `line 212`, `line 88` |
| `server/src/db/channel/LineupRepository.ts` | `rename`, `writeFile` | `line 208`, `line 222` |
| `server/src/ffmpeg/FfmpegProcess.ts` | `writeFile` | `line 169` |
| `server/src/migration/lineups/ChannelLineupMigrator.ts` | `writeFile` | `line 115` |
| `server/src/Server.ts` | `rm`, `writeFile` | `line 496`, `line 569` |
| `server/src/services/cacheImageService.ts` | `mkdir`, `rm` | `line 154`, `line 155` |
| `server/src/services/FileCacheService.ts` | `unlink`, `writeFile` | `line 30`, `line 72` |
| `server/src/services/ImageCache.ts` | `copyFile`, `mkdir` | `line 46`, `line 49` |
| `server/src/services/TroubleshootService.ts` | `mkdir`, `rm` | `line 388`, `line 562` |
| `server/src/services/XmlTvWriter.ts` | `writeFile` | `line 57` |
| `server/src/stream/ExternalSubtitleDownloader.ts` | `mkdir`, `writeFile` | `line 78`, `line 83`, `line 98` |
| `server/src/stream/hls/BaseHlsSession.ts` | `mkdir`, `rm` | `line 119`, `line 124`, `line 138`, `line 143` |
| `server/src/stream/hls/HlsSession.ts` | `unlink` | `line 456` |
| `server/src/tasks/SubtitleExtractorTask.ts` | `mkdir` | `line 225`, `line 272` |
| `server/src/testing/ffmpeg/FfmpegIntegrationHelper.ts` | `rm` | `line 58` |
| `server/src/testing/ffmpeg/fixtures/1080p_hevc_hdr10.ts` | `rM`, `RM` | `line 13572`, `line 2133` |
| `server/src/testing/globalTestSetup.ts` | `copyFile`, `mkdir`, `rm` | `line 31`, `line 32`, `line 38` |
| `server/src/testing/testDbFactory.ts` | `copyFile` | `line 11` |
| `server/src/util/containerUtil.test.ts` | `mkdirSync`, `writeFileSync` | `line 32`, `line 33`, `line 38`, `line 48`, `line 49` |
| `server/src/util/fsUtil.ts` | `unlink` | `line 74` |
| `server/src/util/logging/RollingDestination.ts` | `copyFileSync`, `renameSync`, `unlinkSync` | `line 140`, `line 171`, `line 182`, `line 215` |
| `shared/scripts/generate_search_diagram.ts` | `writeFileSync` | `line 13` |

## Process-Spawn Sites

These are included because route handlers or persistence workflows may invoke
FFmpeg, FFprobe, workers, shell commands, or tooling. Presence in a module does
not prove that every API route in that module spawns a process.

| Module | Candidate operations | Candidate locations |
| --- | --- | --- |
| `scripts/generate-docs-script.ts` | `exec` | `line 13`, `line 14`, `line 27` |
| `scripts/implementation-baseline/lib/git.mjs` | `exec`, `execFileSync` | `line 10`, `line 89` |
| `scripts/implementation-baseline/lib/workspaces.mjs` | `exec` | `line 28` |
| `scripts/implementation-baseline/test/capture.test.mjs` | `execFileSync` | `line 16`, `line 25` |
| `server/scripts/download-meilisearch.ts` | `exec`, `execSync` | `line 76`, `line 77` |
| `server/scripts/make-bin.ts` | `exec` | `line 226` |
| `server/src/ffmpeg/FfmpegProcess.ts` | `exec`, `spawn` | `line 234`, `line 99` |
| `server/src/ffmpeg/ffmpegText.ts` | `spawn` | `line 48` |
| `server/src/ffmpeg/GetLastPtsDuration.ts` | `spawn` | `line 27` |
| `server/src/services/MeilisearchService.ts` | `spawn` | `line 583` |
| `server/src/services/scheduling/ProgramIterator.ts` | `fork` | `line 151`, `line 213`, `line 22`, `line 37`, `line 98` |
| `server/src/services/scheduling/RandomSlotsService.test.ts` | `fork` | `line 179` |
| `server/src/services/scheduling/ShuffleProgramIterator.ts` | `fork` | `line 70` |
| `server/src/services/scheduling/slotSchedulerUtil.ts` | `fork` | `line 583` |
| `server/src/services/scheduling/StaticProgramIterator.ts` | `fork` | `line 21` |
| `server/src/services/scheduling/WeightedFillerProgramIterator.ts` | `fork` | `line 96` |
| `server/src/testing/ffmpeg/FfmpegIntegrationHelper.ts` | `execFileSync`, `spawnSync` | `line 110`, `line 152`, `line 17`, `line 197`, `line 234`, `line 278`, `line 63`, `line 97` |
| `server/src/util/ChildProcessHelper.ts` | `execFile`, `spawn` | `line 165`, `line 178`, `line 79` |
| `web/src/components/channel_config/ChannelPropertiesEditor.tsx` | `exec` | `line 85` |

## Cross-Store Boundaries

The most significant inherited boundary is channel programming: SQLite owns
channel metadata and materialized program relationships while per-channel JSON
documents own lineup order, schedule configuration, and related state. Static
source shows transaction use for SQLite mutations and separate LowDB/filesystem
writes. It does not show a transaction spanning both stores.

No writer is reclassified as authoritative merely because it appears in this
inventory. Characterization tests must establish ordering, rollback, partial
failure, startup recovery, and deletion behavior.
