# ChannelForge Change-Risk Classification

- **Status:** Adopted
- **Roadmap milestone:** M01 Baseline and Change Control
- **Initial authority commit:** `53c1ac125e24a8f3601aa4f00ef848482a4f144d`

## Classification Rule

Assign the highest risk level triggered by any part of the pull request.

Risk is based on failure impact, not line count. A small change to a migration,
secret, stream route, active-plan pointer, or device identity can be Critical.

Do not lower a classification because a change is additive, internal, or
maintained by one person.

## Risk Dimensions

Evaluate:

- Runtime behavior
- Data durability
- Write-authority transition
- Migration and rollback
- API and client compatibility
- Provider behavior
- Scheduling determinism
- Playout continuity
- FFmpeg process execution
- Output identity
- Security and secrets
- Deployment and container behavior
- Generated evidence
- Scope and reversibility

## Low

Typical changes:

- Documentation with no policy, release, or runtime effect
- Additive sanitized test fixture
- Additive pure type with no active caller
- Non-runtime lint rule
- Internal development script with no production use

Required evidence:

- Scope and correctness review
- `git diff --check`
- No unintended generated changes
- Build when repository contracts or imports are touched

Escalate above Low when documentation adopts mandatory process, migration,
security, compatibility, or release policy.

## Moderate

Typical changes:

- Change-control or contribution policy
- Characterization tests
- Additive module interface
- Additive repository with no active write cutover
- New read-only endpoint
- New compatibility metric
- Additive migration metadata
- New deterministic baseline tooling

Required evidence:

- Boundary review
- Focused tests
- Compatibility statement
- Observability statement
- Build
- Rollback or removal statement
- Sanitization review for fixtures and generated evidence

## High

Typical changes:

- New table or durable document
- Active write-path change
- Provider mapping or synchronization behavior
- Scheduling behavior
- FFmpeg command or stream-selection change
- Stream-route or output-contract change
- Credential handling
- Public API contract change
- Container path, permission, network, or device-mapping change
- Background task that mutates durable state

Required evidence:

- Migration and rollback plans
- Integration tests
- Security review
- Operator impact
- Compatibility fixtures
- Failure injection or explicit safe-failure tests
- Linux authoritative validation for runtime paths
- Release-note assessment

## Critical

Typical changes:

- Active publication cutover
- Legacy write freeze
- Database conversion or destructive migration
- Backup or restore authority
- Secret re-encryption or master-key transition
- Device identity change
- Legacy table or durable-state deletion
- Release migration
- Authentication or authorization trust-boundary cutover
- Irreversible client-visible identity change

Required evidence:

- Verified backup
- Migration and rollback rehearsal
- Failure injection
- Recovery timing
- Security approval
- Operator procedure
- Release notes
- Explicit approval before merge
- Post-cutover verification
- Defined rollback-window closure

## Escalation Triggers

Escalate at least one level when a pull request:

- Combines multiple architectural boundaries
- Changes both an implementation and its replacement
- Changes generated output without the generator
- Relies on unclassified baseline failures
- Introduces nondeterministic tests
- Changes platform behavior without Linux validation
- Changes compatibility without usage evidence
- Uses a broad rename or formatting rewrite
- Alters secrets, tokens, private paths, or support output
- Cannot be rolled back independently

## Change-Type Matrix

| Change | Minimum risk |
| --- | --- |
| Typographical documentation correction | Low |
| Mandatory process or contribution policy | Moderate |
| Characterization fixture or golden file | Moderate |
| Additive module contract | Moderate |
| Read-only compatibility adapter | Moderate |
| New SQLite table | High |
| New or changed write path | High |
| Provider normalization change | High |
| Scheduling, filler, repeat, or cooldown change | High |
| FFmpeg command or stream-selection change | High |
| XMLTV, M3U, HLS, or HDHomeRun contract change | High |
| Credential storage or redaction change | High |
| Active-plan pointer cutover | Critical |
| Legacy write freeze | Critical |
| Destructive migration or legacy data deletion | Critical |
| Backup/restore authority change | Critical |
| Secret re-encryption | Critical |
| Device identity change | Critical |

## Review Record

The pull-request description must state:

```text
Risk level:
Risk triggers:
Failure impact:
Rollback:
Required gates:
Completed evidence:
```

A reviewer may raise the risk classification. Lowering it requires a written
explanation showing that the triggering behavior is not in scope.

## Mixed-Risk Pull Requests

The highest component risk controls the entire pull request.

Split mixed-risk work when independent review, rollback, or testing is
possible. A large generated artifact does not make a pull request High by
itself; an unreviewable semantic scope does.

## Deferred Risk

Deferral is acceptable only when the finding is:

- Understood
- Recorded in the issue register
- Assigned an owner
- Assigned a target milestone
- Nonblocking to current baseline accuracy
- Protected by a safe compatibility boundary

Deferral does not reduce the risk of the eventual implementation change.
