# Milestone 02 Module-Boundary Evidence

- **Milestone status:** In Progress
- **Current implementation unit:** PR 02B - Shared-Kernel Classification and Enforcement
- **Enforcement mode:** Path-scoped strict enforcement
- **Runtime behavior changed:** No
- **Production file moved:** No
- **Stable primitive extracted:** Yes

## Purpose

This directory records the enforceable module-boundary policy introduced during
Milestone 02.

PR 02A established the policy and test harness before production source moves.
PR 02B classifies the inherited shared package, establishes one governed kernel
entry point, and blocks new modules from adopting legacy shared surfaces.

## Evidence Artifacts

| Artifact | Purpose |
| --- | --- |
| `naming-and-layout.md` | Canonical module names, directory categories, and public entry-point convention |
| `import-rules.md` | Initial enforceable rules and critical-rule classification |
| `architecture-tests.md` | Test tool, command, fixtures, output, and CI behavior |
| `waivers.md` | Exact-match waiver schema, expiry, and review rules |
| `decision-register.md` | Local M02 implementation decisions that do not require ADRs |
| `shared-kernel-classification.md` | Shared-package inventory, export classification, ownership, and migration disposition |
| `scripts/architecture/shared-boundaries.json` | Machine-readable package-entry classification |
| `scripts/architecture/` | Deterministic architecture scanner, registries, and self-tests |
| `.github/workflows/architecture.yml` | Linux and Windows architecture-test execution |

## Scope Boundary

PR 02A and PR 02B do not:

- Move production files
- Create production module shells
- Change API routes
- Change persistence
- Change provider behavior
- Change scheduling or playout behavior
- Rename inherited packages
- Migrate existing shared-package consumers
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
or build output. The exact inherited `SmartCollectionsDB.ts` import is recorded for
removal in PR 02F; the baseline cannot match another source path or import
specifier, and an unused entry fails validation.

The minimum no-regression metric is:

```text
new architecture violations = 0
```
