# Milestone 01 Completion Report

- **Milestone:** 01 - Baseline and Change Control
- **Decision:** Complete upon merge of PR #13
- **Baseline anchor:** `f77cb75f86a86de2dca5050c15bd298166b2365e`
- **Pre-completion main commit:** `4d98408fa55e26d254132d931bde8a016d89f962`
- **Authoritative Linux evidence commit:** `426c50bf4dccb776a656446a90725d4c2eb71098`
- **Runtime behavior changed:** No
- **Next milestone:** 02 - Module Boundaries

## Executive Decision

Milestone 01 completion gates are satisfied for the approved documentation,
inventory, characterization-foundation, and platform-baseline scope.

PR #13 may be marked ready for review after its final checks pass. Approval to
begin canonical Milestone 02 work becomes effective when PR #13 is merged into
`main`.

## Build and Test Status

| Area | Result |
| --- | --- |
| Windows build | Passed |
| Linux build | Passed |
| Baseline utility tests | 10 passed on Windows and Linux |
| Characterization foundation | 5 passed on Windows and Linux |
| Authoritative Linux full suite | Passed: shared 192; web 76; server 1,117 with 2 skipped |
| Windows full suite | Classified: server 1,074 passed, 43 failed, 2 skipped |
| Windows failure classification | 40 SQLite cleanup differences; 3 path-form differences; no unknown failures |
| Repository cleanliness | Passed |
| PR checks at Linux evidence commit | Build, Linux baseline, commit lint, and message extraction passed |

## Inventory Status

The reviewed baseline includes:

- Repository, workspace, toolchain, dependency, and source-tree inventories
- Persistence stores and write-authority inventory
- API, OpenAPI, configuration, and filesystem inventory
- Provider and catalog inventory
- Scheduling, filler, flex, and interstitial inventory
- Playout, FFmpeg, XMLTV, M3U, HLS, and HDHomeRun-compatible output inventory
- Background-task, child-process, and runtime-entry inventory
- Deployment-path inventory and closure
- Security-control and credential-surface baseline
- Characterization matrix and test-infrastructure inventory
- Change-control, risk, contribution, and pull-request authority
- Issue and flake registers

## Characterization Coverage

The inherited test suite and Milestone 01 characterization foundation provide a
measurable safety net. Fixed-clock, seeded-random, canonical-JSON, checksum, and
provider-contract fixture helpers are available for later focused coverage.

The following high-risk automated coverage remains intentionally deferred:

- Jellyfin and Emby provider contract parity: `BASE-004`, Milestone 05
- Same-input, same-seed scheduling fixtures: `BASE-005`, Milestone 07
- M3U and HDHomeRun-compatible golden contracts: `BASE-006`, Milestone 08

These deferrals do not authorize replacement before their target milestone
coverage is added.

## Finding Disposition

| Finding | Status entering M02 | Effect |
| --- | --- | --- |
| `BASE-001` | Open, nonblocking | Windows path-form support work retained for M10 |
| `BASE-002` | Open, nonblocking | Windows SQLite cleanup work retained for M10 |
| `BASE-003` | Resolved | Authoritative Linux baseline passed |
| `BASE-004` | Deferred | Provider replacement blocked until M05 contract coverage |
| `BASE-005` | Deferred | Scheduler replacement blocked until M07 deterministic fixtures |
| `BASE-006` | Deferred | Output replacement blocked until M08 golden contracts |
| `BASE-007` | Resolved | Change-control authority adopted |
| `BASE-008` | Deferred | External-feed runtime assigned to M05-M09 |

No finding with `Blocks M01 = Yes` remains open.

## Completion Gates

| # | Gate | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Baseline commit is recorded | Met | `repository-baseline.json`; baseline README |
| 2 | Workspace inventory exists | Met | `workspace-inventory.md` |
| 3 | Toolchain inventory exists | Met | `toolchain-inventory.md` |
| 4 | Dependency inventory exists | Met | `dependency-inventory.md` |
| 5 | Source-tree inventory exists | Met | `source-tree-inventory.md` |
| 6 | Runtime entry points are identified | Met | source-tree and background-runtime inventories |
| 7 | Build baseline is reproducible | Met | Windows and Linux test-baseline reports |
| 8 | Windows test failures are classified | Met | `windows-test-baseline.md` |
| 9 | Linux authoritative test baseline exists | Met | run `30307943127`; `linux-test-baseline.md` |
| 10 | Persistence stores are inventoried | Met | `persistence-inventory.md` |
| 11 | Current write authorities are identified | Met | `persistence-write-authority.md` |
| 12 | API routes are inventoried | Met | `api-inventory.md` |
| 13 | First-party UI callers are mapped | Met | API and OpenAPI inventories |
| 14 | Provider adapters are inventoried | Met | `provider-catalog-inventory.md` |
| 15 | Credential storage is inventoried | Met | persistence, configuration, and security closure |
| 16 | Current program identity is documented | Met | provider/catalog and persistence inventories |
| 17 | Scheduling entry points are inventoried | Met | `scheduling-interstitial-inventory.md` |
| 18 | Nondeterminism sources are identified | Met | scheduling inventory and test infrastructure |
| 19 | Playout entry points are inventoried | Met | `playout-output-inventory.md` |
| 20 | FFmpeg command planning is characterized | Met | playout/output inventory |
| 21 | XMLTV behavior is characterized | Met | playout/output inventory and characterization matrix |
| 22 | M3U behavior is characterized | Met with deferred golden gap | `BASE-006` |
| 23 | HDHomeRun-compatible behavior is characterized | Met with deferred golden gap | `BASE-006` |
| 24 | Configuration sources are inventoried | Met | `configuration-filesystem-inventory.md` |
| 25 | Filesystem paths are inventoried | Met | configuration/filesystem and background-runtime inventories |
| 26 | Deployment paths are inventoried | Met | `security-deployment-closure.md` |
| 27 | Background jobs are inventoried | Met | `background-runtime-inventory.md` |
| 28 | Security baseline exists | Met | `security-deployment-closure.md` |
| 29 | Characterization matrix exists | Met | `characterization-matrix.md` |
| 30 | High-risk missing coverage is recorded | Met | `BASE-004` through `BASE-006` |
| 31 | Change-control rules are adopted | Met | PR #11 and change-control documents |
| 32 | Issue register exists | Met | `issue-register.md` |
| 33 | No secrets are committed | Met for reviewed M01 scope | redaction tests, sanitized evidence, review |
| 34 | No unintended runtime behavior changed | Met | documentation, test-only helpers, and CI evidence only |
| 35 | Completion report approves Milestone 02 entry | Met upon PR #13 merge | This report |

## Risks Entering Milestone 02

1. Module boundaries may expose hidden coupling not visible in static inventory.
2. Existing package names and legacy concepts remain inherited and must not be
   broadly renamed.
3. Provider, scheduler, and output behavior cannot be replaced before their
   deferred contract coverage is added.
4. Windows test cleanup and path behavior remain imperfect.
5. Security and deployment inventories are not substitutes for Milestone 09 and
   Milestone 10 implementation and validation.
6. Architecture tests must prevent new code from bypassing the boundaries
   introduced in Milestone 02.

## Milestone 02 Approval

Canonical Milestone 02 work is approved after all of the following occur:

1. This completion documentation is committed to PR #13.
2. The final PR #13 checks pass.
3. PR #13 is reviewed and merged into `main`.
4. Local `main` is synchronized with the merge commit.
5. Milestone 02 begins on a new, focused branch.

Milestone 02 may define and enforce module boundaries. It may not replace
provider, scheduling, playout, output, security, or deployment behavior under
the authority of this approval.
