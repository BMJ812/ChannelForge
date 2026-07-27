# Milestone 01 Baseline Evidence

- **Source commit:** `195a4d04aca082af04362152f56283c139e9eaad`
- **Source branch:** `docs/m01-repository-toolchain-inventory`
- **Milestone status:** In Progress
- **Inventory scope:** Repository and toolchain baseline

## Purpose

This directory contains the reviewed evidence for Milestone 01 PR 01B.
The artifacts describe inherited repository state without changing runtime
behavior, package identity, persistence, provider behavior, or public APIs.

## Artifacts

| Artifact | Purpose |
| --- | --- |
| `repository-baseline.json` | Compact machine-readable baseline anchor and counts |
| `repository-capture.json` | Raw deterministic output from the PR 01A capture framework |
| `repository-inventory.md` | Repository identity, root scripts, and Turbo task graph |
| `workspace-inventory.md` | Root and workspace package manifests and commands |
| `toolchain-inventory.md` | Verified local toolchain and configuration authorities |
| `dependency-inventory.md` | Declared dependency counts and complete manifest inventory |
| `workspace-dependency-graph.md` | Direct inherited workspace dependency edges |
| `source-tree-inventory.md` | Git-tracked file distribution by directory and extension |

## Reproduction

Run from the repository root at the recorded source commit:

```powershell
$Output = node scripts/implementation-baseline/capture.mjs all --compact
$Text = ($Output -join "`n").Trim() + "`n"
[System.IO.File]::WriteAllText(
    'docs/implementation/baseline/repository-capture.json',
    $Text,
    [System.Text.UTF8Encoding]::new($false)
)
```

The Markdown inventories are human-reviewed summaries derived from the raw
capture, tracked package manifests, `pnpm-workspace.yaml`, `turbo.json`,
and `git ls-files` at the same source commit.

## Evidence Rules

- Treat the source commit as immutable historical evidence.
- Replace artifacts deliberately when the source commit changes materially.
- Keep old results available through Git history.
- Do not include environment-file contents, credentials, tokens, passwords,
  provider secrets, absolute repository paths, or user-profile paths.
- Preserve inherited Tunarr names until later migration work authorizes change.
