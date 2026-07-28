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
| Report SHA-256 | `ed7caf38459a04b0b7793969e284d88ea9485d72e67a5c9198d1702555ea9029` |
| Manifest SHA-256 | `e9422dc6984a478d8efb61e5302d30c6b5cdc0172bccbf242db3681958a5afca` |

The artifact contains command text, exit codes, complete logs, a
machine-readable report, repository-cleanliness evidence, and a SHA-256
manifest.

## Completion-Documentation Verification

The completion-documentation head
`04109aa2dc2bfcfc4c25d0852a02136dc8b45672` was independently validated by
successful workflow run `30313571172`.

| Property | Value |
| --- | --- |
| Artifact ID | `8671321650` |
| Artifact size | 11,538 bytes |
| Artifact digest | `sha256:900b82a1eaa93dc46ffb74fab0bfd0984a8c97636987cba5a1a3dc6cd723a655` |
| Report generated | `2026-07-27T23:17:35.396Z` |
| Report SHA-256 | `5ed04a3d91717b23e0abf1b4a4b4f176f0cb63b374842366998fe9b5b41e0f1c` |
| Manifest SHA-256 | `2a5a4647ef3501a281023d7e5fb106e0d32da94ed7124dc6451f548b5aa8a7c7` |

That run recorded exit code `0` for the baseline tests, characterization
foundation, build, full test suite, and repository-cleanliness guard. Its
manifest contained 16 records, and every recorded file size and SHA-256 matched
the downloaded artifact.

This subsequent verification does not replace the release-authoritative source
anchor above. It confirms that adding the completion documentation did not
change or invalidate the inherited baseline result.

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
