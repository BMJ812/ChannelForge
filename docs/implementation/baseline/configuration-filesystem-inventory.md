# Configuration and Filesystem Inventory

- **Source commit:** `0e5491f87259123a3cb085e3d2ba3844eda510d0`
- **Discovery evidence SHA-256:** `9957491ba89d96bcc67bdd17a8ab7be275618fa645ad021de7fa6c6347e322d9`
- **Status:** Reviewed static baseline
- **Environment values captured:** No

## Configuration Precedence and Authorities

| Authority | Current role |
| --- | --- |
| CLI `--database` | Selects the database directory |
| `TUNARR_DATABASE_PATH` | Overrides the default data directory through environment handling |
| `TUNARR_DATABASE_NAME` | Overrides the default SQLite filename |
| Platform defaults | Container `/config`; Windows `APPDATA`; macOS/Linux home-based paths |
| `settings.json` | Persistent application and system settings |
| `TUNARR_BIND_ADDR` | Server bind address |
| Settings APIs and CLI | Mutate persistent settings |
| Package scripts and checked-in config | Build, migration, OpenAPI, and generated-client behavior |

The default application data directory retains inherited
`tunarr` naming. Milestone 01 does not change it.

## Environment-Key Inventory

| Key | Category | References | Source locations | Secret-value handling |
| --- | --- | ---: | --- | --- |
| `APPDATA` | Data location | 2 | `server/src/util/defaults.ts:15`, `server/src/util/defaults.ts:16` | Value not captured |
| `container` | Runtime environment | 1 | `server/src/util/containerUtil.ts:40` | Value not captured |
| `CONTAINER` | Runtime environment | 1 | `server/src/util/containerUtil.ts:39` | Value not captured |
| `DATABASE_DEBUG_LOGGING` | Logging and diagnostics | 2 | `server/src/db/DBAccess.ts:70`, `server/src/db/DBAccess.ts:95` | Value not captured |
| `ENABLE_SSDP_DEBUG_LOGGING` | Logging and diagnostics | 1 | `server/src/services/HDHRService.ts:22` | Value not captured |
| `HOME` | Data location | 2 | `server/src/util/defaults.ts:18`, `server/src/util/defaults.ts:20` | Value not captured |
| `LOG_LEVEL` | Logging and diagnostics | 2 | `server/src/api/systemApi.ts:543`, `server/src/api/systemApi.ts:544` | Value not captured |
| `NODE_ENV` | Runtime environment | 5 | `server/scripts/bundle.ts:43`, `server/src/api/systemApi.ts:540`, `server/src/api/systemApi.ts:541`, `server/src/util/index.ts:330`, `web/vite.config.ts:24` | Value not captured |
| `TUNARR_BIND_ADDR` | Runtime environment | 1 | `web/vite.config.ts:67` | Value not captured |
| `TUNARR_BUILD` | Build metadata | 1 | `server/scripts/bundle.ts:45` | Value not captured |
| `TUNARR_DATABASE_NAME` | Data location | 1 | `server/src/util/defaults.ts:54` | Value not captured |
| `TUNARR_DATABASE_PATH` | Data location | 1 | `server/drizzle.config.ts:9` | Value not captured |
| `TUNARR_EDGE_BUILD` | Build metadata | 3 | `server/scripts/bundle.ts:33`, `server/scripts/bundle.ts:46`, `server/scripts/make-bin.ts:69` | Value not captured |
| `TUNARR_TEST_FFMPEG` | Test override | 1 | `server/src/testing/ffmpeg/FfmpegIntegrationHelper.ts:34` | Value not captured |
| `TUNARR_TEST_FFPROBE` | Test override | 1 | `server/src/testing/ffmpeg/FfmpegIntegrationHelper.ts:37` | Value not captured |
| `TUNARR_TEST_VAAPI_DEVICE` | Test override | 1 | `server/src/testing/ffmpeg/FfmpegIntegrationHelper.ts:190` | Value not captured |
| `TUNARR_VERSION` | Build metadata | 3 | `server/scripts/bundle.ts:44`, `server/scripts/make-bin.ts:196`, `web/vite.config.ts:17` | Value not captured |
| `TZ` | Runtime environment | 5 | `server/src/services/scheduling/TimeSlotService.test.ts:1740`, `server/src/services/scheduling/TimeSlotService.test.ts:1741`, `server/src/services/scheduling/TimeSlotService.test.ts:1745`, `server/src/services/scheduling/TimeSlotService.test.ts:1748`, `server/src/services/scheduling/TimeSlotService.test.ts:2012` | Value not captured |

No discovered key name directly denotes a provider token, password, API key, or
client secret. This does not prove that settings or SQLite fields contain no
sensitive values.

## Durable and Runtime Paths

| Path or pattern | Purpose | Authority | Retention/cleanup evidence |
| --- | --- | --- | --- |
| Configured database directory | Root of persistent application state | CLI/environment/platform default | Preserved |
| `db.db` or `TUNARR_DATABASE_NAME` | Primary SQLite database | DBAccess | Migration/backup controlled |
| `settings.json` | Persistent settings | SettingsDB/LowDB | Versioned schema; no static retention limit |
| `channel-lineups/{id}.json` | Channel lineup and schedule state | LineupRepository/LowDB | Renamed to `.bak` for soft deletion |
| `xmltv.xml` | Published XMLTV guide | XMLTV task/service | Derived and replaceable |
| `images/uploads` | Uploaded images | Upload API | Cleanup policy not established here |
| `cache/images` | Cached image payloads | Cache image service | Explicit clear endpoint exists |
| `cache/subtitles` | Subtitle cache | Runtime services | Derived |
| `backups` | Configured backups | Backup services | Policy configured through settings |
| `db-*.bak` | Migration backup files | Startup migration path | Startup retains the latest three |
| `streams` | Runtime stream artifacts | Streaming services | Operational/temporary |
| Configured logs directory | Runtime logs | Logging subsystem | Roll settings control retention |
| `tunarr-openapi.json` | Root generated OpenAPI document | OpenAPI tooling/dev server | Generated |
| `docs/generated/tunarr-v<version>-openapi.json` | Versioned API documentation | OpenAPI command | Generated/release evidence |
| `tunarr-troubleshoot` | Troubleshooting session data | Troubleshoot service | Cleanup requires characterization |

## Package Command Evidence

| Package | Script | Command |
| --- | --- | --- |
| `@tunarr/server` | `generate-openapi` | `tsx src/index.ts generate-openapi` |
| `@tunarr/server` | `kysely` | `dotenv -e .env.development -- kysely` |
| `@tunarr/types` | `gen-emby` | `typed-openapi https://swagger.emby.media/openapi.json -r zod -o ./build/emby-generated.ts` |
| `@tunarr/web` | `generate-client` | `openapi-ts` |

## Filesystem Mutation Surface

The static collector found 67 filesystem-write
candidates across 30 modules. See
`persistence-write-authority.md` for the complete module-level
listing.

The static collector also found 38 process-spawn
candidates across 19 modules. These include FFmpeg,
FFprobe, workers, shell/tooling, or process management candidates and require
route/service characterization before security classification.

## Security and Privacy Boundaries

- Environment values and environment-file contents were not read.
- Source snippets were not emitted into the raw discovery JSON.
- Absolute repository and profile paths were rejected.
- Persistent settings and provider records may contain sensitive operational
  information even when no secret-looking environment key exists.
- Uploaded filenames, configured paths, logging output, generated diagnostics,
  and troubleshooting bundles require separate disclosure review.
