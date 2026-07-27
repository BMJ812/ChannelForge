# Persistence Inventory

- **Source commit:** `0e5491f87259123a3cb085e3d2ba3844eda510d0`
- **Discovery evidence SHA-256:** `9957491ba89d96bcc67bdd17a8ab7be275618fa645ad021de7fa6c6347e322d9`
- **Status:** Reviewed static baseline
- **Runtime behavior changed:** No

## Scope and Method

This inventory combines the sanitized discovery capture with source review of
the active database connection, Drizzle schema, Kysely/Drizzle migration stack,
LowDB settings, per-channel lineup documents, backup behavior, and configured
filesystem paths.

Static evidence does not provide production row counts. Data-volume estimates
therefore remain explicitly unknown rather than inferred from schema names.

## Summary

| Measure | Count |
| --- | ---: |
| Git-tracked files at source commit | 1834 |
| Text files scanned | 1494 |
| Raw table declarations across current schema and migrations | 187 |
| Unique raw table names | 82 |
| Current Drizzle schema tables | 39 |
| Migration candidate files | 160 |
| SQL migration files | 47 |
| Legacy TypeScript migration files | 17 |
| Named TypeScript migration files | 36 |
| Drizzle snapshot files | 45 |
| Drizzle journal files | 1 |
| Lineup migration files | 7 |

## Storage Map

| Store | Engine | Location | Authority | Current writers | Evidence |
| --- | --- | --- | --- | --- | --- |
| Primary SQLite database | better-sqlite3 with Kysely and Drizzle | Configured database directory plus `TUNARR_DATABASE_NAME` or `db.db` | Authoritative operational state | Repository/DB classes and migrations | Verified |
| `settings.json` | LowDB with Zod-backed adapter | Configured database directory | Authoritative application settings | `SettingsDB` and settings APIs/CLI | Verified |
| `channel-lineups/{channelId}.json` | LowDB with Zod-backed adapter | `channel-lineups` under configured database directory | Authoritative lineup/schedule document | `LineupRepository` | Verified |
| `channel-lineups/{channelId}.json.bak` | Filesystem rename convention | `channel-lineups` under configured database directory | Soft-deleted/restorable lineup evidence | `LineupRepository.markLineupFileForDeletion` | Verified |
| `xmltv.xml` | Generated XML document | Configured path; default is database directory | Derived publication output | XMLTV generation task/service | Verified |
| `db-*.bak` and `backups/` | SQLite/filesystem backup artifacts | Configured database directory | Recovery evidence | Migration and backup services | Verified |
| `cache/`, `images/`, `streams/`, and `logs/` | Filesystem directories | Configured database directory | Derived cache, upload, stream, and log data | Runtime services | Verified |

## SQLite Connection Baseline

| Setting | Current value |
| --- | --- |
| Connection timeout | 5000 ms |
| Journal mode | WAL |
| Synchronous mode | NORMAL |
| Temporary storage | MEMORY |
| Cache size | 10000 pages |
| Memory mapping | 268435456 bytes |
| Foreign keys | ON |
| Migration tables | `migrations`, `migration_lock` |

The primary connection exposes the same Better SQLite3 handle through Kysely
and Drizzle. A process-local mutex protects migration inspection and migration
table synchronization. This is not a general transaction boundary for all
runtime writes.

## Current SQLite Schema

| Table | Concept | Schema authority | Read-path evidence | Write-path evidence | PK declarations | FK references | Unique declarations | Index declarations | Authority | Secret-content review | Data volume | Migration risk | Target concept | Retention |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| `artwork` | Catalog metadata | `server/src/db/schema/Artwork.ts:38` | `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/program/ProgramGroupingRepository.ts`, `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/program/ProgramUpsertRepository.ts` (+5 more) | `server/src/db/LocalMediaDB.ts:103`, `server/src/db/LocalMediaDB.ts:114`, `server/src/db/program/ProgramMetadataRepository.ts:53`, `server/src/db/program/ProgramMetadataRepository.ts:56` (+4 more) | 1 | 3 | 0 | 3 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `cached_image` | Image cache | `server/src/db/schema/CachedImage.ts:5` | `server/src/db/schema/db.ts` | `server/src/services/cacheImageService.ts:113`, `server/src/services/cacheImageService.ts:165` | 1 | 0 | 0 | 0 | Derived/rebuildable cache | No obvious secret field term | UNKNOWN (runtime data required) | High | Image cache | Rebuildable; cache policy |
| `channel` | Channels and published lineups | `server/src/db/schema/Channel.ts:26` | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/channel/ChannelReadOpsRepository.ts`, `server/src/db/channel/LineupRepository.ts` (+8 more) | `server/src/db/channel/BasicChannelRepository.ts:122`, `server/src/db/channel/BasicChannelRepository.ts:215`, `server/src/db/channel/BasicChannelRepository.ts:275`, `server/src/db/channel/BasicChannelRepository.ts:287` (+12 more) | 1 | 1 | 2 | 1 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Channels and published lineups | Until explicit update or deletion |
| `channel_fallback` | Channels and published lineups | `server/src/db/schema/ChannelFallback.ts:8` | `server/src/db/schema/db.ts`, `server/src/db/schema/index.ts` | None found | 0 | 2 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | Moderate | Channels and published lineups | Until explicit update or deletion |
| `channel_filler_show` | Channels and published lineups | `server/src/db/schema/ChannelFillerShow.ts:14` | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/schema/Channel.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts` (+1 more) | `server/src/db/channel/BasicChannelRepository.ts:134`, `server/src/db/channel/BasicChannelRepository.ts:228`, `server/src/db/channel/BasicChannelRepository.ts:231`, `server/src/db/channel/BasicChannelRepository.ts:357` (+2 more) | 0 | 2 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Channels and published lineups | Until explicit update or deletion |
| `channel_programs` | Channels and published lineups | `server/src/db/schema/ChannelPrograms.ts:8` | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/channel/LineupRepository.ts`, `server/src/db/program/ProgramGroupingRepository.ts` (+4 more) | `server/src/db/channel/BasicChannelRepository.ts:372`, `server/src/db/channel/ChannelProgramRepository.ts:377`, `server/src/db/channel/ChannelProgramRepository.ts:381`, `server/src/db/channel/LineupRepository.ts:399` (+4 more) | 0 | 2 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Channels and published lineups | Until explicit update or deletion |
| `credit` | Catalog metadata | `server/src/db/schema/Credit.ts:13` | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/Artwork.ts`, `server/src/db/schema/derivedTypes.ts` (+3 more) | `server/src/db/program/ProgramMetadataRepository.ts:436`, `server/src/db/program/ProgramMetadataRepository.ts:439`, `server/src/db/program/ProgramMetadataRepository.ts:443` | 1 | 2 | 0 | 2 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `custom_show` | Custom programming collections | `server/src/db/schema/CustomShow.ts:8` | `server/src/db/schema/CustomShowContent.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/SubtitlePreferences.ts` | `server/src/db/CustomShowDB.test.ts:181`, `server/src/db/CustomShowDB.test.ts:582`, `server/src/db/CustomShowDB.ts:150`, `server/src/db/CustomShowDB.ts:176` (+2 more) | 1 | 1 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Custom programming collections | Until explicit update or deletion |
| `custom_show_content` | Custom programming collections | `server/src/db/schema/CustomShowContent.ts:14` | `server/src/db/schema/CustomShow.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/index.ts` | `server/src/db/CustomShowDB.test.ts:190`, `server/src/db/CustomShowDB.ts:193`, `server/src/db/CustomShowDB.ts:305`, `server/src/db/CustomShowDB.ts:309` | 0 | 2 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Custom programming collections | Until explicit update or deletion |
| `external_collections` | Collections | `server/src/db/schema/ExternalCollection.ts:17` | `server/src/db/schema/index.ts` | `server/src/db/ExternalCollectionRepo.ts:19`, `server/src/db/ExternalCollectionRepo.ts:46` | 1 | 2 | 0 | 2 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Collections | Until explicit update or deletion |
| `external_collection_programs` | Collections | `server/src/db/schema/ExternalCollection.ts:48` | `server/src/db/schema/index.ts` | None found | 0 | 3 | 0 | 1 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Collections | Until explicit update or deletion |
| `filler_show` | Interstitial and filler programming | `server/src/db/schema/FillerShow.ts:9` | `server/src/db/schema/ChannelFillerShow.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/FillerShowContent.ts` (+2 more) | `server/src/db/FillerListDB.ts:140`, `server/src/db/FillerListDB.ts:162`, `server/src/db/FillerListDB.ts:279` | 1 | 1 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Interstitial and filler programming | Until explicit update or deletion |
| `filler_show_content` | Interstitial and filler programming | `server/src/db/schema/FillerShowContent.ts:13` | `server/src/db/schema/db.ts`, `server/src/db/schema/FillerShow.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/Program.ts` | `server/src/db/FillerListDB.ts:128`, `server/src/db/FillerListDB.ts:133`, `server/src/db/FillerListDB.ts:176` | 0 | 2 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Interstitial and filler programming | Until explicit update or deletion |
| `genre` | Catalog metadata | `server/src/db/schema/Genre.ts:7` | `server/src/db/converters/CommonDaoMinter.ts`, `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/derivedTypes.ts` (+3 more) | `server/src/db/program/ProgramMetadataRepository.ts:135` | 1 | 0 | 0 | 1 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `genre_entity` | Catalog metadata | `server/src/db/schema/Genre.ts:16` | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/Program.ts`, `server/src/db/schema/ProgramGrouping.ts` | `server/src/db/program/ProgramMetadataRepository.ts:133`, `server/src/db/program/ProgramMetadataRepository.ts:143` | 0 | 3 | 2 | 5 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `local_media_folder` | Media sources and libraries | `server/src/db/schema/LocalMediaFolder.ts:7` | `server/src/db/schema/db.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/LocalMediaSourcePath.ts`, `server/src/db/schema/Program.ts` (+1 more) | `server/src/db/LocalMediaDB.ts:56`, `server/src/db/LocalMediaDB.ts:75`, `server/src/db/LocalMediaDB.ts:93` | 1 | 1 | 0 | 3 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media sources and libraries | Until explicit update or deletion |
| `local_media_source_path` | Media sources and libraries | `server/src/db/schema/LocalMediaSourcePath.ts:12` | `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/MediaSource.ts` (+1 more) | None found | 1 | 2 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media sources and libraries | Until explicit update or deletion |
| `media_source` | Media sources and libraries | `server/src/db/schema/MediaSource.ts:22` | `server/src/db/schema/CustomShow.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/ExternalCollection.ts` (+8 more) | `server/src/db/CustomShowDB.test.ts:67`, `server/src/db/mediaSourceDB.ts:182`, `server/src/db/mediaSourceDB.ts:204`, `server/src/db/mediaSourceDB.ts:257` (+4 more) | 1 | 0 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media sources and libraries | Until explicit update or deletion |
| `media_source_library` | Media sources and libraries | `server/src/db/schema/MediaSourceLibrary.ts:9` | `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/ExternalCollection.ts`, `server/src/db/schema/index.ts` (+6 more) | `server/src/db/mediaSourceDB.ts:224`, `server/src/db/mediaSourceDB.ts:235`, `server/src/db/mediaSourceDB.ts:374`, `server/src/db/mediaSourceDB.ts:414` (+5 more) | 1 | 1 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media sources and libraries | Until explicit update or deletion |
| `media_source_library_replace_path` | Media sources and libraries | `server/src/db/schema/MediaSourceLibraryReplacePath.ts:6` | `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/MediaSource.ts` | `server/src/db/mediaSourceDB.ts:273`, `server/src/db/mediaSourceDB.ts:276`, `server/src/db/mediaSourceDB.ts:396` | 1 | 1 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media sources and libraries | Until explicit update or deletion |
| `program` | Media catalog and program metadata | `server/src/db/schema/Program.ts:51` | `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/program/ProgramGroupingRepository.ts`, `server/src/db/program/ProgramSearchRepository.ts`, `server/src/db/program/ProgramStateRepository.ts` (+22 more) | `server/src/db/ChannelDB.test.ts:377`, `server/src/db/CustomShowDB.test.ts:148`, `server/src/db/CustomShowDB.test.ts:555`, `server/src/db/mediaSourceDB.ts:167` (+6 more) | 1 | 9 | 2 | 10 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | Until explicit update or deletion |
| `program_chapter` | Media catalog and program metadata | `server/src/db/schema/ProgramChapter.ts:12` | `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts` (+1 more) | `server/src/db/program/ProgramUpsertRepository.ts:276` | 1 | 1 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | Until explicit update or deletion |
| `program_external_id` | Media catalog and program metadata | `server/src/db/schema/ProgramExternalId.ts:21` | `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/program/BasicProgramRepository.ts`, `server/src/db/program/ProgramExternalIdRepository.ts`, `server/src/db/program/ProgramGroupingRepository.ts` (+4 more) | `server/src/db/program/ProgramExternalIdRepository.ts:203`, `server/src/db/program/ProgramExternalIdRepository.ts:217`, `server/src/db/program/ProgramExternalIdRepository.ts:248`, `server/src/db/program/ProgramExternalIdRepository.ts:262` (+3 more) | 1 | 2 | 4 | 5 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | Until explicit update or deletion |
| `program_grouping` | Program grouping metadata | `server/src/db/schema/ProgramGrouping.ts:48` | `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/program/BasicProgramRepository.ts`, `server/src/db/program/ProgramGroupingRepository.ts`, `server/src/db/program/ProgramGroupingUpsertRepository.ts` (+14 more) | `server/src/db/mediaSourceDB.ts:173`, `server/src/db/program/ProgramGroupingUpsertRepository.ts:146`, `server/src/db/program/ProgramGroupingUpsertRepository.ts:277`, `server/src/db/program/ProgramStateRepository.ts:43` (+2 more) | 1 | 4 | 0 | 2 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Program grouping metadata | Until explicit update or deletion |
| `program_grouping_external_id` | Program grouping metadata | `server/src/db/schema/ProgramGroupingExternalId.ts:22` | `server/src/db/channel/ChannelProgramRepository.ts`, `server/src/db/program/ProgramGroupingRepository.ts`, `server/src/db/program/ProgramGroupingUpsertRepository.ts`, `server/src/db/schema/db.ts` (+3 more) | `server/src/db/program/ProgramGroupingUpsertRepository.ts:347`, `server/src/db/program/ProgramGroupingUpsertRepository.ts:381`, `server/src/db/program/ProgramGroupingUpsertRepository.ts:404`, `server/src/db/program/ProgramGroupingUpsertRepository.ts:448` (+2 more) | 1 | 3 | 2 | 3 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Program grouping metadata | Until explicit update or deletion |
| `program_media_file` | Media catalog and program metadata | `server/src/db/schema/ProgramMediaFile.ts:8` | `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts` (+1 more) | `server/src/db/program/ProgramUpsertRepository.ts:296` | 1 | 2 | 0 | 2 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | Until explicit update or deletion |
| `program_media_stream` | Media catalog and program metadata | `server/src/db/schema/ProgramMediaStream.ts:15` | `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts` (+1 more) | `server/src/db/program/ProgramUpsertRepository.ts:254` | 1 | 1 | 0 | 1 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | Until explicit update or deletion |
| `program_play_history` | Media catalog and program metadata | `server/src/db/schema/ProgramPlayHistory.ts:10` | `server/src/db/schema/Channel.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/Program.ts` | `server/src/db/ProgramPlayHistoryDB.ts:107`, `server/src/db/ProgramPlayHistoryDB.ts:115`, `server/src/db/ProgramPlayHistoryDB.ts:123`, `server/src/db/ProgramPlayHistoryDB.ts:74` (+2 more) | 1 | 3 | 0 | 4 | Operational history | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | No explicit static retention limit found |
| `program_subtitles` | Media catalog and program metadata | `server/src/db/schema/ProgramSubtitles.ts:6` | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts` (+1 more) | `server/src/db/program/ProgramMetadataRepository.ts:375`, `server/src/db/program/ProgramMetadataRepository.ts:378`, `server/src/db/program/ProgramMetadataRepository.ts:390`, `server/src/db/program/ProgramMetadataRepository.ts:397` (+2 more) | 1 | 1 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | Until explicit update or deletion |
| `program_version` | Media catalog and program metadata | `server/src/db/schema/ProgramVersion.ts:13` | `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts` (+4 more) | `server/src/db/program/ProgramUpsertRepository.ts:206`, `server/src/db/program/ProgramUpsertRepository.ts:211` | 1 | 1 | 0 | 1 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Media catalog and program metadata | Until explicit update or deletion |
| `smart_collection` | Collections | `server/src/db/schema/SmartCollection.ts:4` | `server/src/db/schema/index.ts` | `server/src/db/SmartCollectionsDB.ts:119`, `server/src/db/SmartCollectionsDB.ts:128`, `server/src/db/SmartCollectionsDB.ts:152` | 1 | 0 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Collections | Until explicit update or deletion |
| `stream_selection_profiles` | Stream selection configuration | `server/src/db/schema/StreamSelectionProfile.ts:4` | `server/src/db/schema/Channel.ts`, `server/src/db/schema/FillerShow.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/Program.ts` | `server/src/api/streamSelectionApi.ts:118`, `server/src/api/streamSelectionApi.ts:163`, `server/src/api/streamSelectionApi.ts:208` | 1 | 0 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | Moderate | Stream selection configuration | Until explicit update or deletion |
| `studio` | Catalog metadata | `server/src/db/schema/Studio.ts:7` | `server/src/db/converters/CommonDaoMinter.ts`, `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/derivedTypes.ts` (+3 more) | `server/src/db/program/ProgramMetadataRepository.ts:201`, `server/src/services/PlexMediaCanonicalizers.ts:204` | 1 | 0 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `studio_entity` | Catalog metadata | `server/src/db/schema/Studio.ts:12` | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/Program.ts` (+1 more) | `server/src/db/program/ProgramMetadataRepository.ts:199`, `server/src/db/program/ProgramMetadataRepository.ts:209` | 0 | 3 | 0 | 3 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `channel_subtitle_preferences` | Channels and published lineups | `server/src/db/schema/SubtitlePreferences.ts:21` | `server/src/db/channel/BasicChannelRepository.ts`, `server/src/db/channel/ChannelConfigRepository.ts`, `server/src/db/schema/derivedTypes.ts` | `server/src/db/channel/BasicChannelRepository.ts:160`, `server/src/db/channel/BasicChannelRepository.ts:245`, `server/src/db/channel/BasicChannelRepository.ts:249`, `server/src/db/channel/BasicChannelRepository.ts:408` | 0 | 1 | 0 | 1 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Channels and published lineups | Until explicit update or deletion |
| `custom_show_subtitle_preferences` | Custom programming collections | `server/src/db/schema/SubtitlePreferences.ts:45` | None found | None found | 0 | 1 | 0 | 1 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Custom programming collections | Until explicit update or deletion |
| `tags` | Catalog metadata | `server/src/db/schema/Tag.ts:7` | `server/src/db/converters/CommonDaoMinter.ts`, `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/program/ProgramUpsertRepository.ts`, `server/src/db/schema/base.ts` (+4 more) | `server/src/db/program/ProgramMetadataRepository.ts:270`, `server/src/db/TagRepo.ts:16`, `server/src/services/PlexMediaCanonicalizers.ts:144`, `server/src/services/PlexMediaCanonicalizers.ts:149` (+7 more) | 1 | 0 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `tag_relations` | Catalog metadata | `server/src/db/schema/Tag.ts:23` | `server/src/db/program/ProgramMetadataRepository.ts`, `server/src/db/schema/index.ts`, `server/src/db/schema/Program.ts`, `server/src/db/schema/ProgramGrouping.ts` | `server/src/db/program/ProgramMetadataRepository.ts:266`, `server/src/db/program/ProgramMetadataRepository.ts:278`, `server/src/db/TagRepo.ts:101`, `server/src/db/TagRepo.ts:42` (+2 more) | 0 | 3 | 0 | 2 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Catalog metadata | Until explicit update or deletion |
| `transcode_config` | Transcode configuration | `server/src/db/schema/TranscodeConfig.ts:135` | `server/src/db/schema/Channel.ts`, `server/src/db/schema/db.ts`, `server/src/db/schema/derivedTypes.ts`, `server/src/db/schema/index.ts` | `server/src/db/TranscodeConfigDB.ts:108`, `server/src/db/TranscodeConfigDB.ts:153`, `server/src/db/TranscodeConfigDB.ts:168`, `server/src/db/TranscodeConfigDB.ts:187` (+7 more) | 1 | 0 | 0 | 0 | Authoritative operational state | No obvious secret field term | UNKNOWN (runtime data required) | High | Transcode configuration | Until explicit update or deletion |

## Durable JSON and Generated Documents

### Settings

`settings.json` is a LowDB document validated by
`SettingsFileSchema`. It includes version/migration state, client
identity, HDHR, XMLTV, Plex stream, FFmpeg, media-source-global, backup,
logging, cache, server, and feature-flag settings. Values are not reproduced in
this inventory.

### Channel Lineups

Each channel has a LowDB-backed JSON lineup document under
`channel-lineups`. The document carries lineup items, calculated
start offsets, update time, schema version, schedule configuration, and
on-demand configuration. Renaming to `.bak` provides inherited
soft-delete/restore behavior.

The lineup repository also writes SQLite channel/program relationships.
Static evidence therefore identifies a cross-store consistency boundary that
requires characterization before replacement.

### Derived and Recovery Files

- `xmltv.xml` is a generated guide publication.
- `db-*.bak` and `backups/` hold migration or configured
  recovery evidence.
- `cache/` and its image/subtitle children are derived.
- `images/uploads/` contains user-supplied image files.
- `streams/` contains runtime stream artifacts.
- The configured log directory contains runtime logs.

## Migration Surface

The active migration path combines Kysely migration bookkeeping with the
Drizzle migration provider. Historical MikroORM migration state may be
translated into the current migration tables. The source also retains legacy
TypeScript migrations, generated SQL migrations, snapshots, and specialized
JSON lineup migrations.

Temporary names beginning with `__new_`, ending in
`_tmp`, or containing `temp_alter` are migration
implementation details, not current schema authorities.

## Known Risks and Unknowns

- Runtime row counts and growth rates require a live-data sampling procedure.
- Backup consistency across SQLite and JSON lineup documents is not proven by
  static source.
- Cross-store writes are not assumed atomic.
- Migration idempotency and down-migration behavior require characterization.
- Secret-content classification is based only on field-name evidence.
- Restore testing and busy/locking behavior remain separate baseline work.
