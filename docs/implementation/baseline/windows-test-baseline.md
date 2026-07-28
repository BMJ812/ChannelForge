# Milestone 01 Windows Test Baseline

- **Status:** Classified
- **Role:** Supported development platform
- **Release authority:** No; Linux is authoritative for release behavior
- **Source commit:** `4d98408fa55e26d254132d931bde8a016d89f962`
- **Evidence generated:** `2026-07-27T21:08:07Z`
- **Runtime behavior changed:** No

## Platform

| Property | Value |
| --- | --- |
| Operating system | Microsoft Windows 11 Pro |
| Operating-system version | `10.0.26200` |
| Architecture | AMD64 |
| PowerShell | `5.1.26100.8894` |
| Node.js | `v22.20.0` |
| pnpm | `10.28.0` |
| Git | `2.53.0.windows.2` |

## Required Commands

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm baseline:test` | Passed; 10 tests | `baseline-test.log.txt` |
| Characterization-foundation Vitest command | Passed; 5 tests | `characterization-foundation.log.txt` |
| `pnpm build` | Passed; 5 Turbo tasks | `build.log.txt` |
| `pnpm test` | Classified failure; inherited Windows differences | `windows-full-test.log.txt` |

## Full-Suite Result

| Workspace | Test files | Tests |
| --- | --- | --- |
| `@tunarr/shared` | 6 passed | 192 passed |
| `@tunarr/web` | 11 passed | 76 passed |
| `@tunarr/server` | 80 passed, 6 failed, 1 skipped | 1,074 passed, 43 failed, 2 skipped |

The root test command completed four of five Turbo tasks successfully and failed
only in `@tunarr/server`.

## Failure Classification

All 43 Windows failures are classified. No unclassified failure remains.

| Classification | Count | Affected tests | Finding |
| --- | ---: | --- | --- |
| SQLite temporary-file cleanup and locking | 40 | `ChannelDB.test.ts` (20), `CustomShowDB.test.ts` (18), `ProgramDB.test.ts` (1), `TagRepo.test.ts` (1) | `BASE-002` |
| Windows-native path separators versus POSIX assertions | 3 | `fsUtil.test.ts` (2), `iconUtil.test.ts` (1) | `BASE-001` |

The SQLite failures occur while removing temporary `db.db` or `db.db-shm`
files after test activity. The recorded errors are Windows `EBUSY` cleanup
errors; they do not establish failed database assertions.

The path failures compare expected POSIX-style paths with Windows-native
backslash paths.

## Disposition

- `BASE-001` remains open and nonblocking for Milestone 01.
- `BASE-002` remains open and nonblocking for Milestone 01.
- Linux remains the release-authoritative platform.
- Windows remains a supported development platform.
- A future correction must preserve inherited runtime behavior and must not
  normalize away meaningful platform semantics without focused tests.

## Evidence Integrity

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `m01g-preflight.json` | 162,738 | `16a00ee683402552fd2b2116ddfb914a8463f98c72507f32231aacdd4c82171f` |
| `baseline-test.log.txt` | 2,179 | `cd07667622347f75a68e7644e75709b43ced3cd51bc7c31c5bff14cb26bcd368` |
| `characterization-foundation.log.txt` | 451 | `4f1a6f34122ebbdae4ba67c7daf3dbfab04109e5a16584cbb224c67fc1f6a4b7` |
| `build.log.txt` | 1,700 | `af28179b6a38df46113217c86b94a69d5ac5602bcb3b470d0b20a55dd474e0e7` |
| `windows-full-test.log.txt` | 71,220 | `b8091315d7f694b751438697377176bb68b47139ad9a035f8766eab14581a9a1` |
| Windows manifest | 1,330 | `ea433883003f109d738724ef43889c6feb38f507a42452b04bf66dd9585ec9a4` |

The retained evidence is sanitized. It contains no provider calls, environment
values, credentials, absolute repository paths, or user-profile paths.
