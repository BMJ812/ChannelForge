# Milestone 01 Baseline Evidence

- **Milestone status:** In Progress
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

## Evidence Rules

- Treat each recorded source commit as immutable historical evidence.
- Preserve raw static-scan counts separately from reviewed classifications.
- Mark unresolved semantic ownership or compatibility as unknown.
- Keep prior results available through Git history.
- Do not include credentials, tokens, passwords, provider secrets, environment
  values, absolute repository paths, or user-profile paths.
- Preserve inherited Tunarr names until later migration work authorizes change.
