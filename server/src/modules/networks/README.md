# Networks Module

## Purpose

Networks owns ChannelForge editorial network identity and Network profile
revision ownership.

## Public Interface

- `NetworkId`
- `NetworkProfileRevisionId`
- `NetworkCommandService`
- `NetworkQueryService`
- `createNetworksModule()`

## Dependencies

The initial shell has no direct persistence, provider, scheduling, transport,
or compatibility dependency.

## Forbidden Dependencies

Networks domain code must not depend directly on FFmpeg, provider clients,
SQLite records, Fastify, or Scheduling internals.

## Persistence

No Network persistence is introduced or migrated in this M02 unit.

## Runtime Migration

None.

## Migration Status

Shell established. Existing inherited network-like behavior remains unchanged.
