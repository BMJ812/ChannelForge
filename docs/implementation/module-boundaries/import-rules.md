# Initial Import Rules

- **Authority:** Milestone 02 PR 02A
- **Enforcement mode:** Path-scoped strict
- **Current milestone:** M02

## Rule Set

| Rule | Requirement | Strict scope | Waiver |
| --- | --- | --- | --- |
| `MOD-001` | Cross-module imports target the other module's public `index.ts` | New modules | Exact temporary waiver permitted |
| `MOD-002` | Business modules do not depend on the application host | New modules | Exact temporary waiver permitted |
| `MOD-003` | Domain code does not depend on infrastructure, transport, host, or prohibited runtime packages | New module domain paths | Exact temporary waiver permitted |
| `MOD-004` | Scheduling does not depend on Playout, FFmpeg, or process control | Scheduling module | Prohibited |
| `MOD-005` | Playout does not import Programming internals | Playout module | Prohibited |
| `MOD-006` | Web does not import server internals | `web/src/**` | Prohibited |
| `MOD-007` | Business modules do not depend on compatibility implementations | New modules | Exact temporary waiver permitted |
| `MOD-008` | Callers outside a module do not deep-import module internals | New structural roots | Exact temporary waiver permitted |
| `MOD-009` | New modules do not import inherited database internals directly | New modules | Exact temporary waiver permitted |
| `STR-001` | Module directories use an approved canonical name | New module directories | Ownership decision required |
| `STR-002` | Every module exposes `index.ts` | New module directories | Not handled by import waiver |
| `STR-003` | Every module contains `README.md` | New module directories | Not handled by import waiver |
| `STR-004` | Only module directories may exist directly under `server/src/modules` | New modules root | Not handled by import waiver |

## Critical Rules

The initial non-waivable rules are:

```text
MOD-004
MOD-005
MOD-006
```

A critical-rule conflict must be resolved through a public port, ownership
correction, or application-level composition. The waiver registry cannot
disable a critical rule.

## Domain Package Restrictions

Within `server/src/modules/*/domain/**`, the initial harness rejects imports
from:

- Fastify and `@fastify/*`
- SQLite and query-builder implementations
- `node:child_process` and `child_process`
- Axios
- Meilisearch
- `@tunarr/playlist`
- ChannelForge infrastructure, transport, compatibility, and application-host
  roots

The list is intentionally narrow and may be expanded only with fixtures and a
reviewed rule change.

## Legacy Boundary

Inherited `server/src/**` code outside the new structural roots is not globally
reclassified by PR 02A.

This avoids converting known legacy coupling into thousands of unactionable
failures. A later M02 unit must either move a path into strict scope, wrap it
behind compatibility, or add a narrow recorded baseline.

## Path Handling

The scanner normalizes paths to POSIX form before evaluation. Rules therefore
produce the same logical result on Windows and Linux.

Static imports, re-exports, dynamic string imports, and string-literal
`require()` calls are inspected.
