# Milestone 01 Issue Register

- **Status:** Active
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
| BASE-001 | Open | Windows tests | Path-sensitive assertions fail under Windows path forms. | Platform difference | Moderate | No | Test foundation | M01 PR 01G | Baseline test record |
| BASE-002 | Open | Windows SQLite tests | Temporary SQLite cleanup can fail with `EBUSY` locking behavior. | Platform difference | Moderate | No | Test foundation | M01 PR 01G | Baseline test record |
| BASE-003 | Open | Linux validation | A release-authoritative Linux test baseline has not yet been committed. | Missing coverage | High | Yes | Test foundation | M01 PR 01G | Completion gate 9 |
| BASE-004 | Open | Provider contracts | Jellyfin and Emby do not yet have recorded contract coverage equivalent to the strongest Plex client coverage. | Missing coverage | High | Conditional | Provider boundary | M01 PR 01G or explicit deferral | `characterization-matrix.md`; `test-infrastructure.md` |
| BASE-005 | Open | Scheduling determinism | Same-input, same-seed, stable-order schedule fixtures are incomplete. | Missing coverage | Critical | Conditional | Scheduling boundary | M01 PR 01G or explicit deferral | `characterization-matrix.md`; `test-infrastructure.md` |
| BASE-006 | Open | Output contracts | M3U and HDHomeRun-compatible golden contract coverage is incomplete. | Missing coverage | High | Conditional | Output boundary | M01 PR 01G or explicit deferral | `characterization-matrix.md`; `test-infrastructure.md` |
| BASE-007 | Resolved | Change control | ChannelForge change-control, risk, contribution, pull-request, and issue-register authority is adopted. | Documentation gap | Moderate | No | Project governance | M01 PR 01E | PR #11; `../change-control.md` |
| BASE-008 | Deferred | External feeds | No verified inherited YouTube, RSS, Atom, BumpWorthy, or generic web-video feed runtime was identified. | Architecture gap | High | No | Media Sources | M05–M09 | ADR 0002; specification 15; PR 01D inventory |

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
