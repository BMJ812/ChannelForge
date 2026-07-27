# ChannelForge Change-Control Policy

- **Status:** Adopted for implementation work
- **Roadmap milestone:** M01 Baseline and Change Control
- **Risk classification:** Moderate
- **Runtime behavior changed:** No
- **Initial authority commit:** `53c1ac125e24a8f3601aa4f00ef848482a4f144d`

## Purpose

This policy controls how ChannelForge changes the inherited Tunarr foundation
without obscuring behavior, breaking compatibility, or creating multiple
uncoordinated authorities for the same concept.

It applies to documentation, tests, runtime code, persistence, API, UI,
providers, scheduling, playout, output, deployment, migration, security, and
release work.

## Authority Order

When documents conflict, use this order:

1. Architecture specifications in `docs/architecture/spec/`
2. Accepted Architecture Decision Records in `docs/architecture/adr/`
3. `docs/implementation/README.md`
4. The applicable milestone document
5. This policy and `docs/implementation/risk-classification.md`
6. Pull-request descriptions and implementation notes
7. Existing code structure

Existing implementation convenience does not override accepted architecture.

An ADR is required when a change modifies:

- Persistence engine
- Domain ownership
- Scheduling determinism
- Schedule-versus-playout separation
- Plugin isolation
- Deployment topology
- Public API versioning
- Migration authority
- Security trust boundaries

## One Authority per Concept

Every pull request must identify the current and target authority for each
affected concept.

Examples include:

- Catalog identity
- Provider synchronization
- Channel programming
- Schedule planning
- Published plan
- Active-plan pointer
- Playout decision
- XMLTV and M3U generation
- Credential storage
- Migration state

A transition may temporarily use compatibility adapters, but simultaneous
uncoordinated write authorities are prohibited.

## Required Change Request

Every implementation pull request must state:

- Roadmap milestone and work item
- Governing architecture and ADR references
- Current and target behavior
- Current and target data or write authority
- Persistence impact
- API impact
- UI impact
- Provider impact
- Scheduling impact
- Playout and output impact
- Security and privacy impact
- Deployment impact
- Migration and compatibility plan
- Rollback or safe-failure plan
- Tests and validation evidence
- Deferred cleanup
- Risk classification

Use `.github/pull_request_template.md`.

## Pull-Request Boundaries

A pull request should normally change one architectural boundary or introduce
one coherent capability.

Do not combine:

- Dependency upgrades and domain migration
- Package rename and behavior change
- Formatting rewrite and persistence change
- UI redesign and API cutover
- Scheduler replacement and playout replacement
- Credential migration and unrelated settings work
- Legacy deletion and new feature work
- Data migration and unrelated cleanup
- Runtime implementation and broad rebranding
- Security-boundary changes and convenience refactoring

An exception requires a written explanation of why separation would increase
risk and how reviewability remains intact.

## Architecture Traceability

The pull request must name the governing architecture sections.

A new public contract must identify:

- Owning module
- Callers
- Persistence boundary
- Transport boundary
- Security boundary
- Compatibility boundary
- Replacement or retirement condition

When implementation discovers an architecture gap, stop the affected cutover
and resolve the gap in documentation or an ADR before making the new path
canonical.

## Compatibility

Compatibility must be explicit.

For each legacy route, table, document, identifier, environment variable,
filesystem path, container mount, or output contract affected by a change,
state whether it is:

- Preserved
- Read through an adapter
- Dual-read
- Temporarily translated
- Frozen
- Deprecated
- Removed after a measured window
- Out of scope

A legacy path cannot be removed until:

- The replacement is canonical
- First-party callers no longer depend on it
- Supported use is measured
- Migration fixtures pass
- The rollback window closes
- Release notes announce removal
- A focused cleanup pull request is reviewed

## Persistence and Transactions

Persistence changes must remain additive until migration and rollback are
verified.

Provider network requests must remain outside SQLite write transactions.

A persistence change requires:

- Versioned migration
- Forward test
- Restart test
- Backup precondition
- Rollback statement
- Data-loss analysis
- Write-authority transition
- Compatibility-read plan
- Cleanup milestone

New modules may access inherited state only through approved compatibility
interfaces.

## Scheduling and Playout

Scheduling creates plans. Playout consumes published plans.

Playout must not mutate or regenerate schedules while serving a stream.

Changes to any of these require explicit tests:

- Candidate ordering and random seeds
- Repeat and cooldown behavior
- Time-zone and DST behavior
- Duration packing
- Redirects
- Filler, flex, fallback, and offline behavior
- FFmpeg command planning
- Session lifecycle
- XMLTV, M3U, HLS, MPEG-TS, or HDHomeRun-compatible output

## Security and Secrets

No secret may appear in:

- Logs or errors
- XMLTV or M3U
- FFmpeg diagnostics
- Support bundles
- Generated evidence
- Fixtures or snapshots
- Pull-request descriptions

Security-boundary changes require threat analysis, failure behavior, redaction
tests, and rollback or containment.

Future plugins must use explicit capabilities. They must not receive direct
database, unrestricted filesystem, unrestricted network, process-spawn, or
secret-store access.

## Generated Artifacts

Generated artifacts must record or link:

- Source commit
- Generator or reproduction command
- Input scope
- Stable ordering rule
- Sanitization rule
- Output hash when used as baseline evidence

Generated evidence must be reproducible and secret-safe. Large transient logs
may remain outside Git and be summarized.

## Validation

Every pull request must pass:

- Exact-scope review
- `git diff --check`
- Required build or documentation validation
- Every gate required by its risk classification

Known baseline failures must be classified. They must not be hidden by broad
skips, retries, snapshot rewrites, or unrelated expectation changes.

Linux container validation is authoritative for production and release gates.
Windows differences remain supported development findings.

## Rollback and Safe Failure

Every nontrivial pull request must explain how to return to the prior authority
or how the system fails without data loss.

Valid rollback forms include:

- Revert documentation or tests
- Disable an additive path behind a controlled switch
- Restore the prior active pointer
- Re-run a reversible migration
- Restore a verified backup
- Re-enable a compatibility adapter

“Revert the commit” is insufficient when a change has already written durable
state, changed client-visible identity, or altered secrets.

## Emergency Repairs

A critical defect may require a focused repair before the planned milestone
sequence continues.

The repair must:

1. Record the defect.
2. Stop unsafe dependent work.
3. Use a separate branch.
4. Contain only the repair and required tests.
5. Document data or compatibility impact.
6. Re-run affected baseline evidence.
7. Preserve historical evidence.
8. Resume milestone work only after the safe baseline is restored.

Emergency status does not waive secret handling, backup, rollback, or review.

## Exceptions

An exception to this policy must state:

- The rule being excepted
- Why separation or compliance increases risk
- Affected authorities
- Compensating controls
- Validation
- Approval
- Expiration or cleanup condition

Undocumented exceptions are policy violations.
