# Tunarr Compatibility Boundary

- **Milestone:** M02
- **Implementation unit:** PR 02D
- **Namespace:** `server/src/compatibility/tunarr/`
- **Runtime consumer migration:** Jellyfin login identity read
- **New dependency:** None

## Purpose

The Tunarr compatibility namespace is the anti-corruption boundary between
inherited Tunarr implementation and new ChannelForge structural code.

Inherited implementation remains operational in place. PR 02D does not move,
delete, or redesign legacy Tunarr production code.

## Initial Compatibility Read

The first representative read is `SettingsDB.clientId()`.

The compatibility adapter translates this inherited concept into the
ChannelForge-owned read model `{ instanceId: string }`.

The inherited `clientId` terminology and SettingsDB persistence shape do not
escape the adapter.

## Selection

Static discovery identified `server/src/db/mediaSourceDB.ts` as the
highest-connectivity inherited read candidate.

It was intentionally not selected because Media Sources and Catalog module
shell work is assigned to PR 02F.

The SettingsDB identity read is narrow, read-only, and establishes a seam that
PR 02E can consume when the Instance module shell is introduced.

## Public Port

The compatibility port is declared at
`server/src/compatibility/tunarr/ports/index.ts`.

Business modules may depend on declared compatibility ports.
They may not import compatibility implementation files.

## Adapter

The initial adapter is `TunarrInstanceIdentityAdapter`.

It reads the inherited SettingsDB `clientId` and returns the ChannelForge
`instanceId` representation.

PR 02D routes the Jellyfin login identity read through this adapter.

The inherited Emby login read remains unchanged so PR 02D establishes one
representative runtime seam without broad migration.

## Usage Metric

Each compatibility read increments `instance-identity-read`.

A Jellyfin login now records real runtime compatibility use through this
counter.

The counter is process-local migration evidence. It is not durable product
state and introduces no telemetry dependency.

## Architecture Enforcement

`CMP-001` prevents new ChannelForge structural roots from importing inherited
server internals directly.

Compatibility adapters may still import inherited implementation.

`MOD-007` permits business modules to reference the declared compatibility
port while rejecting compatibility implementation imports.

`MOD-009` remains the dedicated rule for direct inherited database imports
from business modules.

## Removal

The compatibility surface is temporary and must remain measurable and
removable.
