# Shared-Kernel Classification

- **Authority:** Milestone 02 PR 02B
- **Package:** `@tunarr/shared`
- **Classification status:** Complete
- **Runtime behavior changed:** No
- **Existing consumer imports changed:** No
- **New dependency:** No

## Inventory

The read-only PR 02B inventory established:

| Measure | Result |
| --- | ---: |
| Tracked shared-package files | 21 |
| Shared-package test files | 3 |
| Matching consumer lines | 163 |
| Unique consumer files | 149 |
| Server matching lines | 91 |
| Web matching lines | 71 |
| Script matching lines | 1 |

The inherited package is a compatibility utility package. It is not itself the
ChannelForge shared kernel.

## Entry-Point Classification

| Entry point | Classification | Consumer files |
| --- | --- | ---: |
| `@tunarr/shared` | Legacy compatibility | 18 |
| `@tunarr/shared/constants` | Legacy compatibility | 10 |
| `@tunarr/shared/types` | Legacy compatibility | 1 |
| `@tunarr/shared/util` | Legacy compatibility | 134 |
| `@tunarr/shared/kernel` | Shared kernel | 0 at introduction |

The machine-readable classification is
`scripts/architecture/shared-boundaries.json`.

## Approved Shared Kernel

The initial governed kernel contains:

```text
isNonEmptyString
```

It is approved because it:

- Performs basic validation
- Has one stable meaning across server and web
- Does not expose a provider payload
- Does not expose persistence or transport data
- Does not encode scheduling, playout, or UI policy
- Preserves its inherited Lodash string semantics

The implementation lives under:

```text
shared/src/kernel/
```

The compatibility entry `@tunarr/shared/util` re-exports the primitive so that
existing consumers do not change in PR 02B.

## Root Export Classification

| Export | Classification | Intended owner |
| --- | --- | --- |
| `ApiProgramMinter` | Module-owned | Media Sources and Catalog compatibility |
| `dayjsMod` | Legacy compatibility | Application bootstrap and Scheduling |
| `MediaSourceId` | Module-owned | Media Sources public contract |
| `createExternalId` | Module-owned | Catalog and Media Sources |
| `createGlobalExternalIdString` | Module-owned | Catalog |
| `createExternalIdFromMulti` | Module-owned | Catalog and Media Sources |
| `createExternalIdFromGlobal` | Module-owned | Catalog |
| `containsMultiExternalId` | Module-owned | Catalog and Media Sources |

No root export moves in PR 02B.

## Constants Classification

| Export | Classification | Intended owner |
| --- | --- | --- |
| `SLACK` | Module-owned | Scheduling |
| `TVGUIDE_MAXIMUM_PADDING_LENGTH_MS` | Module-owned | Publication and guide generation |
| `DEFAULT_GUIDE_STEALTH_DURATION` | Module-owned | Publication and guide generation |
| `TVGUIDE_MAXIMUM_FLEX_DURATION` | Module-owned | Scheduling |
| `TOO_FREQUENT` | Server-only | Playout runtime throttling |
| `DEFAULT_DATA_DIR` | Server-only | Application configuration |
| `PlexClientIdentifier` | Module-owned | Media Sources Plex adapter |
| `DefaultPlexHeaders` | Module-owned | Media Sources Plex adapter |
| Default constants object | Legacy compatibility | Mixed inherited consumers |

No constant moves in PR 02B.

## Type Classification

| Export | Classification | Disposition |
| --- | --- | --- |
| `GenSubtypeMapping` | Legacy compatibility | Retain temporarily |
| `GenGroupedSubtypeMapping` | Web-only | Move with its web consumer later |
| `PerTypeCallback` | Legacy compatibility | Retain for inherited dispatch |

Generic implementation does not by itself qualify a type for the shared kernel.

## Utility Classification

### Shared Kernel

| Export | Classification |
| --- | --- |
| `isNonEmptyString` | Shared kernel |

### Module-Owned

| Export | Intended owner |
| --- | --- |
| `forProgramType` | Programming |
| `forPlexMedia` | Media Sources Plex adapter |
| `buildPlexFilterKey` | Media Sources Plex adapter |
| `buildPlexSortKey` | Media Sources Plex adapter |
| `createTypeSearchField` | Catalog search |
| `createParentFilterSearchField` | Catalog search |
| `emptyStringToNull` | Catalog search |
| `search` namespace | Catalog search |

All search AST types, parser classes, tokenization, request conversion,
normalization, serialization, field mappings, and media-source or library
filter builders are Catalog-search material.

### Legacy Compatibility

The complete `seq` namespace remains a compatibility utility surface:

```text
intersperse
collect
asyncCollect
collectMapValues
groupBy
rotateArray
binarySearchRange
inTuple
inConstArr
invert
```

The following also remain compatibility-only:

```text
dayjsMod
applyOrValue
applyOrValueNoRest
```

### Server-Only

| Export | Classification |
| --- | --- |
| `nullToUndefined` | Server-only |
| `flushEventLoop` | Server-only runtime and task utility |

### Web-Only

| Export | Classification |
| --- | --- |
| `prettifySnakeCaseString` | Web-only presentation |
| `is2Tuple` | Web-only supporting validation |
| `isNumber2Tuple` | Web-only validation |

### Removal Candidates

The following have no tracked consumer in the PR 02B inventory:

```text
isValidRomanNumeral
romanNumeralToNumber
devAssert
dayjsExtensions.min
dayjsExtensions.max
```

PR 02B records the disposition but does not delete code.

## File Classification

| File | Classification |
| --- | --- |
| `shared/package.json` | Legacy compatibility package boundary |
| `shared/scripts/generate_search_diagram.ts` | Module-owned Catalog-search tooling |
| `shared/src/index.ts` | Legacy compatibility barrel |
| `shared/src/services/ApiProgramMinter.ts` | Module-owned Media Sources and Catalog compatibility |
| `shared/src/types/index.ts` | Legacy compatibility mixed types |
| `shared/src/util/constants.ts` | Legacy compatibility mixed constants |
| `shared/src/util/dayjsExtensions.test.ts` | Legacy compatibility characterization |
| `shared/src/util/dayjsExtensions.ts` | Legacy compatibility temporal adapter |
| `shared/src/util/debug.ts` | Removal candidate |
| `shared/src/util/index.ts` | Legacy compatibility barrel |
| `shared/src/util/plexSearchUtil.ts` | Module-owned Plex adapter |
| `shared/src/util/plexUtil.ts` | Module-owned Plex adapter |
| `shared/src/util/searchUtil.test.ts` | Module-owned Catalog-search tests |
| `shared/src/util/searchUtil.ts` | Module-owned Catalog search |
| `shared/src/util/seq.test.ts` | Legacy compatibility characterization |
| `shared/src/util/seq.ts` | Legacy compatibility collection utilities |
| `shared/tsconfig.json` | Legacy compatibility package infrastructure |
| `shared/tsconfig.prod.json` | Legacy compatibility package infrastructure |
| `shared/tsup.config.ts` | Legacy compatibility package infrastructure |
| `shared/turbo.json` | Legacy compatibility package infrastructure |
| `shared/vitest.config.ts` | Legacy compatibility package infrastructure |

New PR 02B files under `shared/src/kernel` are classified Shared kernel.

## Enforcement

PR 02B adds:

- `SHR-001`: require declared package entry points and prohibit deep imports into shared package source or build output across strict roots, legacy server source, root scripts, and server scripts
- `SHR-002`: prohibit legacy shared entry points in new modules
- `SHR-003`: enforce shared-kernel dependency purity
- `SHR-004`: require exact export classification and a valid inherited deep-import baseline

`SHR-001`, `SHR-002`, and `SHR-003` are critical and cannot be waived.
`SHR-004` is noncritical for severity reporting but explicitly non-waivable.

The registry contains one exact inherited baseline for
`server/src/db/SmartCollectionsDB.ts` importing the compiled Catalog-search
utility. It is assigned to Catalog and scheduled for removal in PR 02F. The
baseline does not authorize another source, import specifier, or duplicate
occurrence. Its schema is validated, and the architecture check fails when the
matching inherited import no longer exists.

## Deferred Work

PR 02B does not:

- Migrate existing consumers
- Move `MediaSourceId`
- Redesign external identifiers
- Split mixed constants
- Move the search parser
- Move Plex helpers
- Replace sequence utilities
- Remove unused exports
- Change HLS behavior
- Reclassify `@tunarr/types`
- Rename inherited packages
