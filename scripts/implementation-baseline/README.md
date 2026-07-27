# Milestone 01 Baseline Capture Scripts

This directory contains the read-only capture framework for ChannelForge
Milestone 01, PR 01A.

The scripts inventory repository metadata without importing production runtime
modules or changing application behavior.

## Guarantees

The capture framework is designed to be:

- Read-only against the repository
- Offline
- Deterministically ordered
- Secret-aware
- Cross-platform
- Reproducible from a recorded commit
- Independent of production runtime imports

The framework does not:

- Write generated artifacts into the repository
- Read `.env` files
- Read provider credential stores
- Read application databases
- Spawn FFmpeg
- Contact Plex, Jellyfin, Emby, YouTube, or other providers
- Import server or web runtime modules
- Change package identities
- Change public API paths
- Change application behavior

## Commands

Run all capture tests:

```powershell
pnpm baseline:test
```

Capture all supported metadata as JSON:

```powershell
node scripts/implementation-baseline/capture.mjs all
```

Capture one section:

```powershell
node scripts/implementation-baseline/capture.mjs repository
node scripts/implementation-baseline/capture.mjs workspaces
node scripts/implementation-baseline/capture.mjs tracked-files
```

Emit compact JSON:

```powershell
node scripts/implementation-baseline/capture.mjs all --compact
```

Show help:

```powershell
node scripts/implementation-baseline/capture.mjs --help
```

## Saving Output Outside the Repository

Generated evidence should not be committed until its owning inventory PR defines
the artifact schema and review process.

To save a temporary UTF-8 capture outside the repository:

```powershell
$OutputPath = Join-Path `
    $env:TEMP `
    'channel-forge-baseline-capture.json'

$Capture = node `
    scripts/implementation-baseline/capture.mjs `
    all

[System.IO.File]::WriteAllText(
    $OutputPath,
    ($Capture -join "`n") + "`n",
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host $OutputPath
```

## Commands and Output

### `repository`

Records:

- Current commit
- Current branch or detached state
- Dirty-state flag
- Redacted origin remote
- Node version
- Git version
- Operating-system platform
- CPU architecture
- Safe root-package metadata
- Root script names

It does not emit:

- Absolute repository paths
- Timestamps
- Environment variables
- Secret values

### `workspaces`

Records:

- `pnpm-workspace.yaml` package patterns
- Root-package metadata
- Workspace package paths
- Workspace package identities
- Safe package metadata
- Script names
- Direct workspace dependencies

Dependency versions are intentionally excluded from this initial capture command.
PR 01B owns the reviewed dependency inventory.

### `tracked-files`

Records Git index metadata:

- Repository-relative path
- Git file mode
- Git object ID
- Git stage number
- Tracked-entry count
- Conflicted-entry count

It uses `git ls-files --stage`.

It does not read file contents or hash working-tree files, avoiding line-ending
differences and accidental secret disclosure.

## Determinism

For an unchanged repository state on the same supported toolchain and platform,
two runs of the same command must produce byte-for-byte identical output.

Determinism is maintained by:

- Omitting timestamps
- Omitting absolute paths
- Sorting object keys
- Sorting workspace paths
- Sorting dependency names
- Sorting tracked-file records
- Using Git object IDs instead of working-tree hashes

The following values may legitimately change when their source changes:

- Commit
- Branch
- Dirty-state flag
- Tool versions
- Platform
- Architecture
- Package metadata
- Workspace metadata
- Tracked-file metadata

## Redaction

Recognized secret-bearing keys are replaced with:

```text
[REDACTED]
```

Text redaction covers common forms of:

- Bearer and Basic credentials
- URL user information
- API-key query parameters
- Token query parameters
- Password assignments
- Secret assignments
- Private-key blocks

Redaction is defense in depth.

Capture commands remain intentionally limited to known, tracked metadata files
and Git metadata. They do not perform broad content scanning.

## Read-Only Boundary

Permitted subprocess calls:

- `git rev-parse`
- `git symbolic-ref`
- `git status`
- `git config --get`
- `git ls-files`
- `git --version`

No Git write command is used.

Tests verify that repository status is unchanged after capture commands run.

## Sample Output

The file below is illustrative and is not baseline evidence:

```text
scripts/implementation-baseline/examples/repository.sample.json
```

Actual baseline evidence will be generated and reviewed in later Milestone 01
pull requests.

## Failure Behavior

The command exits nonzero when:

- The current directory is not inside a Git repository
- Required tracked metadata is missing
- Tracked JSON is invalid
- Git metadata cannot be read
- An unsupported command or option is supplied

Errors are written to standard error.

Successful JSON is written only to standard output.
