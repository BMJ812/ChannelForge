# Milestone 02 Module-Boundary Evidence

- **Milestone status:** In Progress
- **Current implementation unit:** PR 02A - Boundary Policy and Architecture Test Harness
- **Enforcement mode:** Path-scoped strict enforcement
- **Runtime behavior changed:** No
- **Production source moved:** No

## Purpose

This directory records the enforceable module-boundary policy introduced during
Milestone 02.

PR 02A establishes the policy and test harness before any production source is
moved into ChannelForge modules.

## PR 02A Artifacts

| Artifact | Purpose |
| --- | --- |
| `naming-and-layout.md` | Canonical module names, directory categories, and public entry-point convention |
| `import-rules.md` | Initial enforceable rules and critical-rule classification |
| `architecture-tests.md` | Test tool, command, fixtures, output, and CI behavior |
| `waivers.md` | Exact-match waiver schema, expiry, and review rules |
| `decision-register.md` | Local M02 implementation decisions that do not require ADRs |
| `scripts/architecture/` | Deterministic architecture scanner, registry, and self-tests |
| `.github/workflows/architecture.yml` | Linux and Windows architecture-test execution |

## Scope Boundary

PR 02A does not:

- Move production files
- Create production module shells
- Change API routes
- Change persistence
- Change provider behavior
- Change scheduling or playout behavior
- Rename inherited packages
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

Inherited server paths outside those roots remain outside strict enforcement
until a later migration unit places them behind a declared boundary.

The minimum no-regression metric is:

```text
new architecture violations = 0
```
