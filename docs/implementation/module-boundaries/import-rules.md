# Initial Import Rules

- **Authority:** Milestone 02 PR 02A through PR 02C
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
| `SHR-001` | Callers outside the shared package use only declared entry points and do not import `shared/src` or `shared/dist` internals | Strict roots, including Types, plus narrow legacy-server and script scans | Prohibited |
| `SHR-002` | New modules import `@tunarr/shared/kernel` rather than inherited shared entry points | New modules | Prohibited |
| `SHR-003` | Shared-kernel source depends only on kernel files and approved neutral packages | `shared/src/kernel/**` | Prohibited |
| `SHR-004` | The shared registry has exact export classifications and a valid inherited-import baseline | Shared boundary registry | Prohibited |
| `TYP-001` | Callers outside the Types package use declared entry points and do not import source or build internals | Strict roots plus narrow legacy-server and script scans | Prohibited |
| `TYP-002` | New modules import `@tunarr/types/contracts` rather than inherited Types entry points | New modules | Prohibited |
| `TYP-003` | Public-contract source depends only on contract files and approved schema packages | `types/src/contracts/**` | Prohibited |
| `TYP-004` | The Types registry has exact export classifications and the canonical contract target | Types boundary registry | Prohibited |

## Critical Rules

The initial non-waivable rules are:

```text
MOD-004
MOD-005
MOD-006
SHR-001
SHR-002
SHR-003
TYP-001
TYP-002
TYP-003
```

A critical-rule conflict must be resolved through a public port, ownership
correction, or application-level composition. The waiver registry cannot
disable a critical rule. `SHR-004` and `TYP-004` remain noncritical for
severity reporting but are also explicitly non-waivable.

## Shared-Package Restrictions

The inherited entry points remain available only as compatibility surfaces:

```text
@tunarr/shared
@tunarr/shared/constants
@tunarr/shared/types
@tunarr/shared/util
```

New ChannelForge modules may import only:

```text
@tunarr/shared/kernel
```

One inherited deep import is recorded as an exact baseline in
`scripts/architecture/shared-boundaries.json`:

```text
server/src/db/SmartCollectionsDB.ts
../../../shared/dist/src/util/searchUtil.js
```

It is scheduled for removal in PR 02F and authorizes no other source or import.
The registry validates exact fields and rejects the entry once its matching
consumer import no longer exists.

The initial kernel contains only `isNonEmptyString`. Kernel production source may
depend on `lodash-es` to preserve inherited string semantics. Kernel tests may
also depend on `vitest`. Provider payloads, `@tunarr/types`, search parsers,
Day.js mutation, runtime APIs, and legacy shared utilities are prohibited.

## Types-Package Restrictions

The inherited entry points remain available as compatibility surfaces:

```text
@tunarr/types
@tunarr/types/api
@tunarr/types/emby
@tunarr/types/jellyfin
@tunarr/types/plex
@tunarr/types/schemas
```

New ChannelForge modules may import only:

```text
@tunarr/types/contracts
```

The initial contract entry point is intentionally empty. PR 02C establishes the
boundary without promoting inherited Tunarr DTOs, mixed schemas, provider
payloads, persistence shapes, or transport-specific request objects into stable
ChannelForge contracts.

Public-contract production source may depend on `zod`. Public-contract tests
may also depend on `vitest`. Imports from inherited Types source, inherited
package surfaces, provider payloads, Fastify, database implementations, and
other runtime packages are prohibited.

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
