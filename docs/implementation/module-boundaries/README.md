# Milestone 02 Module-Boundary Evidence

- **Milestone status:** In Progress
- **Current implementation unit:** PR 02F - Media Sources and Catalog Module Shells
- **Enforcement mode:** Path-scoped strict enforcement
- **Runtime behavior changed:** No
- **Production file moved:** No
- **Stable primitive extracted:** Yes
- **Canonical public-contract boundary established:** Yes
- **Tunarr compatibility boundary established:** Yes

## Purpose

This directory records the enforceable module-boundary policy introduced during
Milestone 02.

PR 02A established the policy and test harness before production source moves.
PR 02B classifies the inherited shared package, establishes one governed kernel
entry point, and blocks new modules from adopting legacy shared surfaces.
PR 02C classifies the inherited Types package, establishes one governed public-
contract entry point, and prevents new modules from adopting legacy API, schema,
or provider payload surfaces.
PR 02D establishes the Tunarr compatibility namespace, adds the first
compatibility read port and usage metric, and prevents new structural code from
bypassing compatibility to inherited server internals.

## Evidence Artifacts

| Artifact | Purpose |
| --- | --- |
| `naming-and-layout.md` | Canonical module names, directory categories, and public entry-point convention |
| `import-rules.md` | Initial enforceable rules and critical-rule classification |
| `architecture-tests.md` | Test tool, command, fixtures, output, and CI behavior |
| `waivers.md` | Exact-match waiver schema, expiry, and review rules |
| `decision-register.md` | Local M02 implementation decisions that do not require ADRs |
| `shared-kernel-classification.md` | Shared-package inventory, export classification, ownership, and migration disposition |
| `public-contract-classification.md` | Types-package inventory, entry-point classification, and public-contract policy |
| `compatibility-boundary.md` | Tunarr compatibility namespace, initial port, usage metric, and removal policy |
| `scripts/architecture/shared-boundaries.json` | Machine-readable shared-package entry classification |
| `scripts/architecture/types-boundaries.json` | Machine-readable Types-package entry classification |
| `scripts/architecture/` | Deterministic architecture scanner, registries, and self-tests |
| `.github/workflows/architecture.yml` | Linux and Windows architecture-test execution |

## Scope Boundary

PR 02A, PR 02B, and PR 02C do not:

- Move production files
- Create production module shells
- Change API routes
- Change persistence
- Change provider behavior
- Change scheduling or playout behavior
- Rename inherited packages
- Migrate existing shared-package consumers
- Migrate existing Types-package consumers
- Promote inherited API, schema, or provider DTOs into public contracts
- Move provider, search, scheduling, or runtime utilities
- Add a dependency
- Establish final module ownership

Those operations remain assigned to later M02 pull-request units.

## Enforcement Start

Strict enforcement applies immediately to:

- `server/src/modules/**`
- `server/src/app/**`
- `server/src/infrastructure/**`
- `server/src/compatibility/**`
- `server/src/transport/**`
- The web-to-server critical boundary under `web/src/**`

Inherited server paths outside those roots remain outside the module-direction
rules until a later migration unit places them behind a declared boundary.
`SHR-001` scans `types/src/**`, legacy `server/src/**`, `server/scripts/**`, and
root `scripts/**` solely to prevent new deep imports into shared package source
or build output. PR 02F removes the inherited `SmartCollectionsDB.ts` deep
import that was deferred from PR 02B. The inherited shared deep-import baseline
is now empty.

`TYP-001` applies the same no-deep-import policy to `types/src/**`,
`types/dist/**`, and `types/build/**` across strict roots, legacy server
source, root scripts, and server scripts. The PR 02C audit found no production
Types deep import requiring a baseline.

The minimum no-regression metric is:

```text
new architecture violations = 0
```
