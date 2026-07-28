# Milestone 01 Flake Register

- **Status:** No confirmed test flakes
- **Review scope:** Windows baseline, Linux authoritative baseline, and workflow
  harness behavior
- **Runtime behavior changed:** No

## Flake Definition

A flake is a test or required validation command that changes result without a
relevant source, dependency, toolchain, platform, fixture, or configuration
change.

Platform differences and deterministic harness defects are not recorded as
flakes.

## Reviewed Observations

| ID | Observation | Classification | Repeat status | Disposition |
| --- | --- | --- | --- | --- |
| FLK-OBS-001 | Forty Windows database tests reported `EBUSY` while deleting temporary SQLite files. | Platform difference; `BASE-002` | Not rerun to hide the result | Retain as an open Windows-support finding |
| FLK-OBS-002 | Three Windows assertions expected POSIX path forms. | Platform difference; `BASE-001` | Not rerun to hide the result | Retain as an open Windows-support finding |
| FLK-OBS-003 | Initial Linux workflow failed after green commands because evidence was written inside the worktree. | Deterministic CI harness defect | Corrected by source commit, then rerun | Resolved by commit `426c50bf4dccb776a656446a90725d4c2eb71098` |
| FLK-OBS-004 | Corrected Linux workflow passed all commands and the cleanliness guard. | Stable authoritative result | Repeated successfully, including the completion-documentation head | Retained as Milestone 01 evidence |

## Confirmed Flakes

None.

## Retry Policy

- No failed test was converted to green through an unrecorded retry.
- The first Linux run remains preserved as historical evidence.
- The second Linux run followed a reviewed workflow correction at a new commit.
- The workflow passed again at completion-documentation head
  `04109aa2dc2bfcfc4c25d0852a02136dc8b45672`.
- Future retries must preserve the original run, identify the reason, and avoid
  weakening assertions, skips, timeouts, or cleanliness guards.
- A recurring intermittent result must receive a new issue-register finding
  rather than being silently retried.

## Milestone 02 Boundary

Milestone 02 may add architecture tests and module-boundary checks. It must not
classify inherited platform failures as flakes merely to obtain a green result.
