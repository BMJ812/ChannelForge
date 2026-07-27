# Test Infrastructure Baseline

- **Source commit:** `3370c66d801e2525edfce364fc2488d326ec10b3`
- **Source branch:** `test/m01-characterization-foundation`
- **Raw discovery SHA-256:** `2e5dc1bd4f4ff837a4cd434a59b7d7fc42351948c45324043d4e6f6773344680`
- **Normalized discovery SHA-256:** `42c3b3ac98ee541933e0d89f6eb7a8d420593e891e17321ba12502d40b03d2ba`
- **Runtime behavior changed:** No

## Scope

This inventory records Git-tracked test files, configuration files, helper
candidates, fixture candidates, and lexical determinism signals.

The collector emitted paths, hashes, sizes, line counts, package metadata, and
signal locations. It emitted no source snippets or file contents.

Lexical signal counts are discovery aids. Documentation references, generated
data, and coincidental tokens can produce false positives and require source
review.

## Repository Test Surface

| Measure | Count |
| --- | ---: |
| Git-tracked files | 1,850 |
| Scanned text files | 1,686 |
| Scanned text bytes | 40,339,315 |
| Test files | 106 |
| Test/configuration files | 19 |
| Helper candidates | 12 |
| Fixture candidates | 5 |
| Raw signal sites | 1,068 |
| Unreadable files | 0 |

## Tests by Workspace

| Workspace | Test files |
| --- | ---: |
| Root scripts | 2 |
| Server | 90 |
| Shared | 3 |
| Web | 11 |

The Types workspace has no discovered test file.

## Tests by Reviewed Category

| Category | Test files |
| --- | ---: |
| API | 1 |
| Baseline tooling | 2 |
| Other server/shared behavior | 28 |
| Output and guide | 3 |
| Persistence | 6 |
| Playout and FFmpeg | 44 |
| Providers and catalog | 5 |
| Scheduling | 7 |
| UI | 10 |

## Configuration Authorities

The discovery identified:

- Root `vitest.config.ts`
- Server `vitest.config.ts`
- Server `vitest.local.config.ts`
- Shared `vitest.config.ts`
- Web `vitest.config.ts`
- Web test setup
- Server test and build TypeScript configurations
- Root, Shared, Types, and Web TypeScript configurations
- Server Vitest type declarations

PR 01F adds `server/vitest.characterization.config.ts` as a narrow,
database-free configuration for the test-only foundation suite. It does not
replace the inherited server configuration.

## Existing Reusable Infrastructure

Confirmed reusable infrastructure includes:

- `server/src/testing/globalTestSetup.ts`
- `server/src/testing/testDbFactory.ts`
- `server/src/testing/util.ts`
- `server/src/testing/ffmpeg/FfmpegIntegrationHelper.ts`
- `server/src/testing/ffmpeg/FfmpegTestFixtures.ts`
- `web/src/test/utils.tsx`
- Pixel-format and frame-size Vitest matchers
- Baseline capture tests and utility tests

The server global setup creates a pre-migrated template SQLite database and
copies it for tests. That mechanism remains inherited behavior.

## Existing Fixture Surface

The five path-classified fixture candidates are FFmpeg probe fixtures:

- `1080p_h264.ts`
- `1080p_hevc_hdr10.ts`
- `480p_h264.ts`
- `720p_h264.ts`
- `720p_hevc_hdr10.ts`

No dedicated Plex, Jellyfin, or Emby provider fixture directory was discovered.

## Reviewed Determinism Signals

Review limited to discovered test files and `server/src/testing/` found:

| Signal | Sites | Interpretation |
| --- | ---: | --- |
| Clock control | 3 | Limited explicit fake-timer use |
| Clock reads | 69 | Many tests construct or read real time |
| Seeded-random controls | 21 | Existing `random-js` seeds are present |
| Random reads | 13 | Includes seeded generators and two `Math.random()` sites |
| Random identifiers | 66 | Scheduling tests frequently create UUIDs |
| Timers | 5 | Stream-program tests include timeout calls |
| Time-zone controls | 2 | Time-slot tests manipulate or reference `TZ` |
| Temporary filesystem | 3 | FFmpeg helper owns a temp directory |
| Temporary database | 1 | Global setup uses the SQLite test template |
| Provider-client references | 4 | Confirmed in Plex client tests |
| Network-mock token | 1 | Lexical hit inside a large FFmpeg fixture; not confirmed infrastructure |

## Coverage Findings

- Plex has a discovered API-client test.
- No Jellyfin or Emby API-client test file was discovered.
- Scheduling tests already use explicit `random-js` seeds in several cases.
- Stable random identifiers are not centralized.
- Explicit global clock control is limited relative to clock reads.
- No confirmed general provider test server or network-mocking framework was
  found by the collector.
- Golden/checksum policy exists in architecture but lacked a shared test helper.
- Existing test infrastructure is server-heavy; the Types workspace has no
  discovered tests.

## PR 01F Foundation

PR 01F adds:

- Manual test clock
- Explicit seeded-random helper
- Canonical JSON serializer and SHA-256 checksum
- Provider contract fixture metadata and sanitization scaffold
- Focused Vitest configuration
- Self-characterization tests for the helpers
- Repository characterization-testing policy

This foundation does not add Jellyfin, Emby, scheduling-plan, XMLTV, M3U, or
HDHomeRun coverage. Those coverage findings remain open for PR 01G or explicit
deferral in the Milestone 01 completion report.

## Reproduction

The raw discovery was generated outside the repository from a clean checkout of
`3370c66d801e2525edfce364fc2488d326ec10b3` and then copied into this evidence directory after hash and
metadata validation.

The collector was read-only and:

- Read Git-tracked files only
- Excluded environment files
- Read no environment values
- Performed no network access
- Started no production process
- Modified no runtime state
- Emitted no source snippets, file contents, absolute repository paths, or
  user-profile paths
