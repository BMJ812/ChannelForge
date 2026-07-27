# Contributing to ChannelForge

ChannelForge is an architecture-first evolution of the inherited Tunarr
runtime. The governing product principle is:

> Build television networks, not playlists.

Contributions must preserve a working runtime while ChannelForge-owned domain
boundaries are introduced incrementally. Broad renaming, unmeasured
compatibility changes, and big-bang rewrites are not accepted.

## Governing Documents

Read the documents relevant to the proposed change before beginning work:

1. `docs/architecture/spec/`
2. `docs/architecture/adr/`
3. `docs/implementation/README.md`
4. The applicable milestone document in `docs/implementation/`
5. `docs/implementation/change-control.md`
6. `docs/implementation/risk-classification.md`

Architecture specifications are authoritative over the implementation roadmap.
An ADR is required when implementation needs to change an accepted decision
about persistence, domain ownership, scheduling determinism, schedule/playout
separation, plugin isolation, deployment topology, API versioning, migration
authority, or a security trust boundary.

## Development Baseline

The verified foundation uses:

- Node.js 22
- pnpm 10.28.0
- TypeScript and Vitest
- FFmpeg for media-processing and runtime validation
- PowerShell on Windows development systems
- Linux containers as the production authority

Install and build:

```powershell
pnpm install
pnpm build
```

Run the inherited development environment:

```powershell
pnpm dev
```

Run baseline-tooling tests:

```powershell
pnpm baseline:test
```

The inherited full test suite has classified Windows-specific path and SQLite
temporary-database locking failures. Do not hide those failures with broad
skips, retries, or expectation changes. Record the platform and use the
applicable baseline evidence.

## Branches

Do not develop directly on `main`.

Use a narrow branch whose name identifies the change type and scope. Accepted
patterns include:

```text
docs/<scope>
test/<scope>
feat/<scope>
fix/<scope>
migration/<scope>
infrastructure/<scope>
chore/<scope>
```

Milestone work should identify its milestone or PR unit where useful:

```text
docs/m01-change-control-contribution-rules
test/m01-characterization-foundation
feat/module-boundaries
```

A branch should contain one coherent change. Do not mix unrelated cleanup,
formatting, dependency upgrades, rebranding, and behavior changes.

## Pull Requests

Every pull request must use `.github/pull_request_template.md` and identify:

- Roadmap milestone and work item
- Governing architecture and ADR references
- Current and target behavior
- Current and target data or write authority
- Risk classification
- Persistence, API, UI, provider, scheduling, playout, security, deployment,
  migration, and rollback impact
- Validation evidence
- Deferred work

The highest applicable risk determines the pull-request classification. A
documentation-only pull request can be Moderate when it adopts mandatory
process, compatibility, migration, security, or release policy.

## Scope Control

A pull request must not combine the following without a documented exception:

- Dependency upgrades and domain migration
- Package renaming and behavior changes
- Repository-wide formatting and persistence changes
- UI redesign and API cutover
- Scheduler replacement and playout replacement
- Credential migration and unrelated settings work
- Legacy deletion and new feature work
- Generated output changes without the generator or reproduction evidence
- Runtime implementation and broad rebranding

Broad replacement of inherited Tunarr package names, data paths, environment
variables, routes, database names, or compatibility identifiers requires a
separate approved migration plan.

## Testing and Validation

Use the smallest validation set that proves the change, then add every gate
required by `docs/implementation/risk-classification.md`.

At minimum, every pull request must run:

```powershell
git diff --check
pnpm build
```

Documentation work that changes baseline tooling or evidence must also run:

```powershell
pnpm baseline:test
```

Behavior changes require focused tests that fail when the intended behavior
regresses. Characterization tests must control time, randomness, filesystem
state, provider responses, and other nondeterministic inputs.

Linux container behavior is authoritative for production and release
decisions. Windows remains a supported development environment. Platform
specific differences must be classified rather than ignored.

## Data, Security, and Privacy

Never commit:

- Provider credentials or tokens
- Private server URLs or library names
- User databases or production backups
- Private media or viewing history
- User-profile or absolute local paths
- Secret-bearing configuration
- Real device identifiers unless explicitly authorized and sanitized

Provider calls must not occur inside SQLite write transactions.

Secrets must not appear in logs, errors, XMLTV, M3U, FFmpeg diagnostics,
support bundles, generated evidence, test fixtures, or snapshots.

Use synthetic or sanitized fixtures. A fixture should document its source,
sanitization, ownership, and removal or conversion condition.

## Persistence and Migration

Persistence work must remain additive until compatibility, migration, restart,
and rollback behavior are verified.

A persistence pull request must state:

- Current and target write authority
- Read compatibility
- Migration order
- Restart behavior
- Backup preconditions
- Rollback limits
- Data-loss prevention
- Cleanup milestone

New ChannelForge modules must not query inherited tables directly. Use an
approved compatibility interface.

## Scheduling and Playout

Scheduling creates plans. Playout consumes published plans.

Playout must not regenerate or mutate schedules while serving a stream.
Scheduling, repeat behavior, guide identity, stream behavior, provider
matching, FFmpeg command planning, and output identity changes require explicit
characterization and release notes where applicable.

## Generated Files

Generated files must be:

- Reproducible
- Deterministically ordered
- Traceable to a generator or documented command
- Secret-safe
- Separated from hand-authored changes where practical
- Reviewed with their generator or source input

Do not commit transient logs, caches, `node_modules`, private databases, or
host-specific generated media.

## Commits and Merge Strategy

Keep commits logically reviewable. A useful implementation sequence is:

1. Characterization tests
2. New contract or boundary
3. New implementation
4. Compatibility adapter
5. Migration or backfill
6. Call-site transition
7. Legacy-path freeze
8. Cleanup

Normal merge commits are preferred for milestone pull requests when preserving
the commit sequence improves traceability. Squash may be used for small
corrective pull requests.

## Licensing and Attribution

ChannelForge is derived in part from Tunarr under the zlib license.

Do not remove required attribution, license text, or inherited history. Review
`NOTICE.md`, `LICENSE`, and `LICENSES/tunarr-zlib.txt` before changing package,
distribution, container, or release metadata.
