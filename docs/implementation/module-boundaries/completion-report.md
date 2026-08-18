# Milestone 02 Completion Report

- **Milestone:** 02 - Module Boundaries
- **Status:** Complete
- **Completion date:** 2026-08-18
- **Baseline before completion unit:** `6ca17fcd247b81aa6d9913f86d7955d029edab37`
- **Canonical modules:** 17 / 17
- **Architecture waivers:** 0
- **Business-module cycles:** 0
- **Observed cross-module dependency edges:** 15
- **New architecture violations:** 0

## Outcome

Milestone 02 establishes enforceable modular-monolith boundaries while leaving
the inherited Tunarr runtime operational.

All 17 canonical ChannelForge business modules now have:

- A documented purpose
- A public `index.ts`
- Strict architecture enforcement
- No forbidden cross-module deep imports
- No direct dependency on inherited server internals from new module code

## Module Graph

The actual cross-module import graph for `server/src/modules/**` is recorded in:

`module-graph.mmd`

A topological cycle check executed during completion validation reports:

`business-module cycles = 0`

## Ownership

The accepted ownership matrix is recorded in:

`module-ownership.md`

The representative inherited-to-target migration map is recorded in:

`current-to-target-map.md`

## Architecture Enforcement

Stable command:

`pnpm test:architecture`

Completion result:

`PASS`

The architecture workflow executes on both Ubuntu and Windows.

Critical boundaries include:

- Domain cannot depend on infrastructure or transport
- Cross-module deep imports are prohibited
- Scheduling cannot depend on Playout or FFmpeg
- Playout cannot import Programming internals
- Output cannot define a separate canonical Channel identity
- Web cannot import server internals
- New ChannelForge modules cannot import inherited database rows directly
- Compatibility cannot become the ChannelForge domain source of truth

## Web Boundary

PR 02K is satisfied by the existing governed public-contract surface and
architecture enforcement over `web/src/**`.

No UI migration or generated-client regeneration is performed in M02.

See:

`web-boundary.md`

## Shared Kernel and Public Contracts

`@tunarr/shared` exports are classified.

The inherited shared deep-import baseline is empty.

`@tunarr/types` exports are classified.

The governed public-contract entry point remains the allowed contract boundary
for new ChannelForge structural code.

## Compatibility

The Tunarr compatibility namespace exists under:

`server/src/compatibility/tunarr/`

M02 includes measurable compatibility wrappers for:

- Instance identity reads
- Media-source synchronization requests

Existing runtime implementations remain inherited where no narrow replacement
seam has yet been approved.

## Waivers

Authoritative registry:

`scripts/architecture/waivers.json`

Completion count:

`0`

No critical architectural invariant is waived.

A completion snapshot is recorded in:

`architecture-waivers.json`

## Validation

Completion validation executed successfully:

- All ChannelForge module tests
- `pnpm test:architecture`
- `pnpm baseline:test`
- `pnpm build`
- `git diff --check`
- 17/17 module directory verification
- 17/17 module public entry-point verification
- 17/17 module README verification
- Business-module cycle analysis
- Architecture waiver count verification

## Runtime and Persistence Impact

M02 introduces no intentional:

- Database schema cutover
- Legacy table removal
- Scheduler replacement
- FFmpeg behavior replacement
- Output protocol cutover
- Public route redesign
- UI redesign
- Package rebranding

Runtime behavior remains characterized by the inherited baseline while new
ChannelForge code is constrained to the accepted boundaries.

## Known Risks

The principal remaining risks move into later milestones:

- Legacy persistence coupling
- Route-centric orchestration
- Provider DTO leakage inside inherited paths
- Compatibility wrappers becoming long-lived
- FFmpeg/runtime migration complexity
- Legacy identity mapping and reconciliation

These are now contained by explicit ownership and migration boundaries rather
than being unresolved architectural ownership questions.

## Milestone 03 Entry

Milestone 03 is approved as the next canonical implementation milestone.

Proceed to:

`docs/implementation/03-identity-persistence-and-migrations.md`

M03 will introduce ChannelForge-owned persistence, repository implementations,
transaction coordination, schema additions, migration metadata, and concurrency
controls within the boundaries completed here.
