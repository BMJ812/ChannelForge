# Public Contract Classification

- **Authority:** Milestone 02 PR 02C
- **Package:** `@tunarr/types`
- **Classification status:** Complete
- **Runtime behavior changed:** No
- **Existing consumer imports changed:** No
- **New dependency:** No

## Inventory

The read-only PR 02C discovery established:

| Measure | Result |
| --- | ---: |
| Tracked Types-package files | 57 |
| TypeScript source files | 56 |
| Existing source entry points | 6 |
| Matching package-reference lines | 603 |
| Active package specifiers | 6 |
| Production deep imports requiring a baseline | 0 |

The textual discovery produced one apparent deep-import candidate:
`'types/src/bad.ts'` in the architecture self-test. It is fixture data rather
than an import declaration and does not require a compatibility baseline.

## Entry-Point Classification

| Entry point | Classification | Matching occurrences |
| --- | --- | ---: |
| `@tunarr/types` | Legacy compatibility | 346 |
| `@tunarr/types/api` | Legacy API contract | 85 |
| `@tunarr/types/schemas` | Legacy shared schema | 135 |
| `@tunarr/types/plex` | Provider payload | 14 |
| `@tunarr/types/jellyfin` | Provider payload | 13 |
| `@tunarr/types/emby` | Provider payload | 10 |
| `@tunarr/types/contracts` | Public contract | 0 at introduction |
| `@tunarr/types/package.json` | Package metadata | Not counted as a code surface |

The occurrence counts are discovery matches used for migration sizing. They
include inherited source, tests, manifests, and generated localization context;
they are not a promise that every match is an executable import.

The machine-readable classification is
`scripts/architecture/types-boundaries.json`.

## Canonical Public-Contract Boundary

The governed ChannelForge boundary is:

```text
@tunarr/types/contracts
```

Its source lives under:

```text
types/src/contracts/
```

The entry point is intentionally empty in PR 02C. This is a deliberate
classification result, not missing implementation. None of the inherited root,
API, schema, Plex, Jellyfin, or Emby surfaces is sufficiently narrow and
ChannelForge-owned to become the canonical public contract wholesale.

Contracts may be promoted into this boundary only when they:

- Use ChannelForge terminology
- Have an identified module owner
- Exclude persistence records
- Exclude provider-native payloads
- Exclude Fastify request or response objects
- Exclude secrets
- Have stable identifier semantics
- Have compatibility and versioning behavior
- Are tested

## Existing Entry Points

All inherited entry points remain available. PR 02C changes no existing import
specifier and performs no consumer migration.

### Root

The root barrel contains mixed domain-like types, settings, playback details,
events, tasks, FFmpeg settings, and utility types. It remains legacy
compatibility.

### API

The API barrel contains inherited route request and response schemas together
with scheduling and provider-adjacent structures. It remains a legacy API
contract surface and is not the final ChannelForge API boundary.

### Schemas

The schemas barrel contains mixed validation, settings, programming, search,
task, stream-selection, troubleshooting, and compatibility schemas. It remains
a legacy shared-schema surface.

### Provider Surfaces

`plex`, `jellyfin`, and `emby` expose provider-native payloads. They belong
behind Media Sources provider adapters and must not become canonical
ChannelForge domain contracts.

## Enforcement

PR 02C adds:

- `TYP-001`: require declared package entry points and prohibit deep imports
  into Types source or build output across strict roots, legacy server source,
  root scripts, and server scripts
- `TYP-002`: prohibit inherited Types entry points in new modules
- `TYP-003`: enforce public-contract dependency purity
- `TYP-004`: require exact export classification and the canonical
  `./contracts` target

`TYP-001`, `TYP-002`, and `TYP-003` are critical and cannot be waived.
`TYP-004` is noncritical for severity reporting but explicitly non-waivable.

The audit found no production deep import requiring an inherited baseline.

## Deferred Work

PR 02C does not:

- Migrate existing consumers
- Rename `@tunarr/types`
- Redesign the HTTP API
- Promote inherited DTOs wholesale
- Move provider payloads
- Replace Zod schemas
- Change generated clients
- Change route behavior
- Change persistence
- Define final versioned REST resources
