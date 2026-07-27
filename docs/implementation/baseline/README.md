# Milestone 01 Baseline Evidence

- **Milestone status:** Complete
- **Inventory authority:** Git-tracked source and reviewed generated evidence
- **Runtime changes:** None

## Purpose

This directory contains reviewed evidence for Milestone 01. Each evidence set
records inherited behavior at an immutable source commit. The artifacts do not
rename inherited packages, change persistence, alter provider behavior, or
change public API paths.

## Evidence Sets

| PR unit | Scope | Source commit | Source branch |
| --- | --- | --- | --- |
| 01B | Repository and toolchain inventory | `195a4d04aca082af04362152f56283c139e9eaad` | `docs/m01-repository-toolchain-inventory` |
| 01C | Persistence and API inventory | `0e5491f87259123a3cb085e3d2ba3844eda510d0` | `docs/m01-persistence-api-inventory` |
| 01D | Provider, scheduling, and playout inventory | `49be6eec67247b5a3c43efaa928953bfd4c852dd` | `docs/m01-provider-scheduling-playout-inventory` |
| 01E | Change-control and contribution rules | `53c1ac125e24a8f3601aa4f00ef848482a4f144d` | `docs/m01-change-control-contribution-rules` |
| 01F | Characterization test foundation | `3370c66d801e2525edfce364fc2488d326ec10b3` | `test/m01-characterization-foundation` |
| 01G | Platform baselines, closure, and completion | `426c50bf4dccb776a656446a90725d4c2eb71098` | `docs/m01-baseline-reports-completion` |

## Artifacts

| Artifact | Purpose |
| --- | --- |
| `repository-baseline.json` | Compact machine-readable repository baseline |
| `repository-capture.json` | Raw deterministic repository capture |
| `repository-inventory.md` | Repository identity, root scripts, and Turbo graph |
| `workspace-inventory.md` | Workspace package manifests and commands |
| `toolchain-inventory.md` | Verified toolchain and configuration authorities |
| `dependency-inventory.md` | Complete declared manifest dependency inventory |
| `workspace-dependency-graph.md` | Direct inherited workspace dependency edges |
| `source-tree-inventory.md` | Git-tracked source-tree distribution |
| `persistence-api-discovery.json` | Sanitized PR 01C static discovery evidence |
| `persistence-inventory.md` | SQLite tables, durable documents, migration surface, and risks |
| `persistence-write-authority.md` | Database, JSON, filesystem, and transaction writer evidence |
| `api-inventory.md` | Inherited route declarations and compatibility disposition |
| `openapi-inventory.md` | OpenAPI generation and generated-client pipeline |
| `configuration-filesystem-inventory.md` | Environment-key and durable-path evidence |
| `provider-scheduling-playout-discovery.json` | Sanitized PR 01D static discovery evidence |
| `provider-catalog-inventory.md` | Provider adapters, scanners, media-source persistence, and catalog normalization |
| `scheduling-interstitial-inventory.md` | Time/random slots, lineups, filler, flex, mid-roll, and determinism risks |
| `playout-output-inventory.md` | Runtime selection, sessions, FFmpeg, XMLTV, M3U, HLS, and HDHomeRun output |
| `background-runtime-inventory.md` | Tasks, workers, timers, process boundaries, and filesystem authorities |
| `characterization-matrix.md` | Existing coverage and required safety net before subsystem replacement |
| `characterization-foundation-discovery.json` | Sanitized test/config/helper/fixture discovery evidence |
| `test-infrastructure.md` | Reviewed test infrastructure, determinism controls, and coverage gaps |
| `issue-register.md` | Blocking, open, resolved, and deferred Milestone 01 findings |
| `windows-test-baseline.md` | Windows build, test result, and complete failure classification |
| `linux-test-baseline.md` | Release-authoritative Linux build, test, and cleanliness result |
| `platform-matrix.md` | Windows and Linux authority and compatibility matrix |
| `flake-register.md` | Reviewed intermittent-result and retry classification |
| `security-deployment-closure.md` | Security baseline and deployment-path closure |
| `completion-report.md` | Gate-by-gate completion and Milestone 02 entry decision |
| `../change-control.md` | Required authority, scope, compatibility, migration, and rollback policy |
| `../risk-classification.md` | Low, Moderate, High, and Critical change gates |
| `../characterization-testing.md` | Characterization conventions, fixtures, clocks, randomness, and golden rules |
| `../../../CONTRIBUTING.md` | Contributor workflow and validation policy |
| `../../../.github/pull_request_template.md` | Required pull-request evidence template |

## Reproduction

Repository/toolchain evidence is reproduced with:

```powershell
$Output = node scripts/implementation-baseline/capture.mjs all --compact
$Text = ($Output -join "`n").Trim() + "`n"
[System.IO.File]::WriteAllText(
    'docs/implementation/baseline/repository-capture.json',
    $Text,
    [System.Text.UTF8Encoding]::new($false)
)
```

PR 01C evidence was captured from a clean checkout of
`0e5491f87259123a3cb085e3d2ba3844eda510d0`. The collector read Git-tracked source and
configuration only, excluded environment files, did not read environment
values, emitted no source snippets, and did not emit absolute repository or
profile paths. Its normalized evidence SHA-256 is
`9957491ba89d96bcc67bdd17a8ab7be275618fa645ad021de7fa6c6347e322d9`.

PR 01D evidence was captured from a clean checkout of
`49be6eec67247b5a3c43efaa928953bfd4c852dd`. The collector read Git-tracked source only, excluded
environment files and values, emitted no source snippets or file contents, and
did not emit absolute repository or profile paths. Its raw SHA-256 is
`f4fe004082aefe1281687a3262b3607fa119038949197a68f975367bb6058080` and its normalized evidence SHA-256 is
`89c88fffcc9a0fdb1b8e92a901f2686bf648969f517aa8ce72159e0ed1d92f21`.

PR 01E adopts hand-authored change-control authority from clean source commit
`53c1ac125e24a8f3601aa4f00ef848482a4f144d`. Its artifacts introduce no runtime, persistence,
provider, scheduling, playout, output, dependency, or deployment behavior
changes.

PR 01F records the inherited test foundation from clean source commit
`3370c66d801e2525edfce364fc2488d326ec10b3`. Its raw discovery SHA-256 is
`2e5dc1bd4f4ff837a4cd434a59b7d7fc42351948c45324043d4e6f6773344680` and its normalized SHA-256 is
`42c3b3ac98ee541933e0d89f6eb7a8d420593e891e17321ba12502d40b03d2ba`. The pull request adds test-only deterministic helpers,
a focused Vitest configuration, fixture policy, and helper self-tests. It
does not replace production behavior or close subsystem coverage findings.

## PR 01G Platform and Completion Evidence

PR 01G records:

- Sanitized Windows evidence from source commit
  `4d98408fa55e26d254132d931bde8a016d89f962`
- Complete classification of 43 inherited Windows failures
- Release-authoritative Linux evidence from source head
  `426c50bf4dccb776a656446a90725d4c2eb71098`
- Successful GitHub Actions run `30307943127`
- Artifact `m01-linux-baseline`, ID `8669221317`
- Artifact digest
  `sha256:0e33345f45b0e5a8c97abc1f7245affd3602fcbfb990aa2b33201d07e61ff319`
- Platform and flake registers
- Security and deployment closure
- Explicit high-risk coverage deferrals
- Gate-by-gate Milestone 01 completion decision

The completion decision becomes effective when PR #13 is merged. The evidence
does not alter production runtime, persistence, provider, scheduling, playout,
output, or deployment behavior.

## Evidence Rules

- Treat each recorded source commit as immutable historical evidence.
- Preserve raw static-scan counts separately from reviewed classifications.
- Mark unresolved semantic ownership or compatibility as unknown.
- Keep prior results available through Git history.
- Do not include credentials, tokens, passwords, provider secrets, environment
  values, absolute repository paths, or user-profile paths.
- Preserve inherited Tunarr names until later migration work authorizes change.
