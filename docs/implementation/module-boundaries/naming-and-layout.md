# Module Naming and Layout

- **Authority:** Milestone 02 PR 02A
- **Runtime behavior changed:** No

## Structural Categories

New server-side ChannelForge code belongs under one of these roots:

```text
server/src/app/
server/src/modules/
server/src/infrastructure/
server/src/compatibility/
server/src/transport/
```

These categories mean:

| Root | Responsibility |
| --- | --- |
| `app` | Process composition, bootstrap, registration, and shutdown |
| `modules` | Business capabilities and their public contracts |
| `infrastructure` | Technical implementations such as database, filesystem, clock, process, and HTTP |
| `compatibility` | Temporary inherited Tunarr adapters |
| `transport` | HTTP, streaming, XMLTV, M3U, and HDHomeRun-compatible protocol adapters |

## Canonical Module Directories

The initial approved module directory names are:

```text
access
instance
media-sources
catalog
networks
channels
branding
programming
scheduling
publication
playout
output
templates
health
jobs
plugins
migration
```

Module directory names use lowercase kebab-case. A new name outside this list
requires a reviewed ownership decision and may require an ADR when canonical
ownership changes.

## Module Shape

A module directory may contain:

```text
index.ts
README.md
application/
domain/
ports/
adapters/
tests/
```

A module is internal by default.

Every module directory must contain:

- `index.ts`
- `README.md`

Empty placeholder directories are prohibited.

## Public Entry Point

Cross-module callers import only the other module's public entry point.

Preferred server alias:

```ts
import { CatalogQueryService } from '@/modules/catalog';
```

A caller must not import:

```ts
import { CatalogRow } from '@/modules/catalog/internal/catalog-row.js';
```

`index.ts` is the only default public entry point during early M02 work.
Additional public subpaths require a documented decision and architecture-test
coverage.

## History and Compatibility

PR 02A creates no production module directories and moves no source.

Later moves should follow:

1. Move unchanged.
2. Verify tests.
3. Rename separately.
4. Verify tests.
5. Change behavior separately.
6. Add specification tests.

Inherited `@tunarr/*` package names remain unchanged during this unit.
