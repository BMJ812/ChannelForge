# Milestone 01 Issue Register

- **Status:** Milestone 01 complete; retained findings active
- **Authority:** Milestone 01 baseline evidence and reviewed characterization
- **Initial source commit:** `53c1ac125e24a8f3601aa4f00ef848482a4f144d`
- **Runtime behavior changed:** No

## Rules

A finding blocks Milestone 01 when it prevents a reliable build, an
authoritative test result, safe evidence collection, required inventory, or
safe entry into Milestone 02.

A nonblocking finding may be deferred only when it is understood, owned,
assigned to a target milestone, and does not compromise baseline accuracy.

Statuses:

- `Open`
- `In progress`
- `Deferred`
- `Resolved`
- `Superseded`

Classifications:

- Defect
- Test defect
- Platform difference
- Architecture gap
- Security risk
- Migration risk
- Unknown behavior
- Missing coverage
- Dead code candidate
- Documentation gap
- Dependency risk

## Findings

| ID | Status | Area | Finding | Classification | Risk | Blocks M01 | Owner | Target | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BASE-001 | Open | Windows tests | Path-sensitive assertions fail under Windows path forms. | Platform difference | Moderate | No | Test foundation | M10 Windows validation | `windows-test-baseline.md`; `platform-matrix.md` |
| BASE-002 | Open | Windows SQLite tests | Temporary SQLite cleanup can fail with `EBUSY` locking behavior. | Platform difference | Moderate | No | Test foundation | M10 Windows validation | `windows-test-baseline.md`; `platform-matrix.md` |
| BASE-003 | Resolved | Linux validation | Release-authoritative Linux build, test, and cleanliness evidence is recorded. | Missing coverage | High | No | Test foundation | M01 PR 01G | Run `30307943127`; `linux-test-baseline.md` |
| BASE-004 | Deferred | Provider contracts | Jellyfin and Emby do not yet have recorded contract coverage equivalent to the strongest Plex client coverage. | Missing coverage | High | Conditional | Provider boundary | M05 Media Sources and Catalog | `characterization-matrix.md`; `test-infrastructure.md`; disposition below |
| BASE-005 | Deferred | Scheduling determinism | Same-input, same-seed, stable-order schedule fixtures are incomplete. | Missing coverage | Critical | Conditional | Scheduling boundary | M07 Deterministic Scheduling | `characterization-matrix.md`; `test-infrastructure.md`; disposition below |
| BASE-006 | Deferred | Output contracts | M3U and HDHomeRun-compatible golden contract coverage is incomplete. | Missing coverage | High | Conditional | Output boundary | M08 Publication, Playout, and Output | `characterization-matrix.md`; `test-infrastructure.md`; disposition below |
| BASE-007 | Resolved | Change control | ChannelForge change-control, risk, contribution, pull-request, and issue-register authority is adopted. | Documentation gap | Moderate | No | Project governance | M01 PR 01E | PR #11; `../change-control.md` |
| BASE-008 | Deferred | External feeds | No verified inherited YouTube, RSS, Atom, BumpWorthy, or generic web-video feed runtime was identified. | Architecture gap | High | No | Media Sources | M05–M09 | ADR 0002; specification 15; PR 01D inventory |

## Deferred and Open Finding Boundaries

### BASE-001 - Windows path forms

- **Owner:** Test foundation
- **Target:** Milestone 10 Windows validation
- **Reason:** Linux release behavior is green; the remaining failures are
  Windows-native path assertion differences.
- **Compatibility boundary:** Milestone 02 may wrap affected utilities but may
  not change externally visible path semantics to make tests pass.

### BASE-002 - Windows SQLite cleanup

- **Owner:** Test foundation
- **Target:** Milestone 10 Windows validation
- **Reason:** Linux database tests pass; Windows retains temporary SQLite handles
  during cleanup in the recorded run.
- **Compatibility boundary:** A later cleanup fix must not alter database
  transactions, schema, persistence ownership, or runtime durability semantics.

### BASE-004 - Jellyfin and Emby provider contracts

- **Owner:** Provider boundary
- **Target:** Milestone 05 Media Sources and Catalog
- **Reason:** Provider normalization and adapter ownership are implemented in
  Milestone 05, where equivalent sanitized contracts can be added coherently.
- **Compatibility boundary:** Milestone 02 may define interfaces around inherited
  clients, but provider request, response, identity, and error behavior may not
  be replaced before the deferred coverage exists.

### BASE-005 - Scheduling determinism

- **Owner:** Scheduling boundary
- **Target:** Milestone 07 Deterministic Scheduling
- **Reason:** Stable schedule fixtures require the ChannelForge planning
  boundary, seed authority, and ordering rules defined in Milestone 07.
- **Compatibility boundary:** Milestone 02 may isolate the inherited scheduler,
  but it may not make a new scheduler canonical or replace schedule behavior.

### BASE-006 - M3U and HDHomeRun-compatible output contracts

- **Owner:** Output boundary
- **Target:** Milestone 08 Publication, Playout, and Output
- **Reason:** Golden output contracts belong beside publication and output
  ownership implemented in Milestone 08.
- **Compatibility boundary:** Existing M3U and HDHomeRun-compatible output
  remains the compatibility authority until reviewed golden contracts pass.

## Finding Updates

When changing a finding:

1. Preserve the ID.
2. Update status.
3. Link the resolving pull request or evidence.
4. Record any changed risk or blocking decision.
5. Do not delete historical findings merely because they are resolved.
6. Use a new ID when the semantic finding changes materially.

## Milestone 02 Entry

Before Milestone 02 becomes canonical:

- Every `Blocks M01 = Yes` finding must be resolved.
- Every conditional high-risk coverage finding must be covered or explicitly
  deferred with an owner, target milestone, reason, and compatibility boundary.
- The completion report must link this register and state remaining risk.
