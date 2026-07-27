# Milestone 01 Linux Test Baseline

- **Status:** Passed
- **Role:** Release-authoritative baseline
- **Source head commit:** `426c50bf4dccb776a656446a90725d4c2eb71098`
- **Pull request:** `#13`
- **Workflow:** `M01 Linux Baseline`
- **Workflow run:** `30307943127`
- **Runtime behavior changed:** No

## Platform

| Property | Value |
| --- | --- |
| Runner operating system | Linux |
| Runner architecture | X64 |
| Runner image | `ubuntu24` |
| Runner image version | `20260720.247.2` |
| Kernel | Linux `6.17.0-1020-azure` |
| Node.js | `v22.20.0` |
| pnpm | `10.28.0` |
| Git | `2.54.0` |

## Authoritative Commands

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm baseline:test` | 0 | 10 tests passed |
| Characterization-foundation Vitest command | 0 | 5 tests passed |
| `pnpm build` | 0 | 5 Turbo tasks succeeded |
| `pnpm test` | 0 | Full inherited suite passed |
| Repository-cleanliness guard | 0 | Worktree clean before and after |

## Full-Suite Result

| Workspace | Test files | Tests |
| --- | --- | --- |
| `@tunarr/shared` | 6 passed | 192 passed |
| `@tunarr/web` | 11 passed | 76 passed |
| `@tunarr/server` | 86 passed, 1 skipped | 1,117 passed, 2 skipped |

The root test command completed all five Turbo tasks successfully.

## Evidence Identity

| Property | Value |
| --- | --- |
| GitHub Actions run ID | `30307943127` |
| Artifact ID | `8669221317` |
| Artifact name | `m01-linux-baseline` |
| Artifact size | 11,738 bytes |
| Artifact digest | `sha256:0e33345f45b0e5a8c97abc1f7245affd3602fcbfb990aa2b33201d07e61ff319` |
| Report generated | `2026-07-27T21:44:29.673Z` |
| Report SHA-256 | `0d937789ba020f3ae860271f6e76f1e2be06108b29f5c1c4e42a0f00099b51ae` |
| Manifest SHA-256 | `e3978e4e606ce469d5853c081898711cf9e8ec6e91e83d88d8b75769d1d0965a` |

The artifact contains command text, exit codes, complete logs, a
machine-readable report, repository-cleanliness evidence, and a SHA-256
manifest.

## Initial Harness Failure

Run `30306695868` executed all required commands successfully but failed its
final cleanliness guard because the workflow initially wrote its own evidence
directory inside the Git worktree.

Commit `426c50bf4dccb776a656446a90725d4c2eb71098` moved evidence to the runner
temporary directory. Run `30307943127` then passed without changing runtime
code or weakening the cleanliness requirement.

This was a deterministic evidence-harness defect, not a test flake and not a
ChannelForge runtime defect.

## Disposition

The successful run resolves `BASE-003`.

Linux is the authoritative platform for inherited release behavior entering
Milestone 02. Windows differences remain documented separately and do not
override this result.
