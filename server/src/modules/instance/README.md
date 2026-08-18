# Instance Module

## Purpose

Instance owns installation-wide ChannelForge identity and lifecycle concepts.

PR 02E establishes the public module shell and first identity read boundary.
It does not migrate the inherited settings store.

## Public Interface

- `InstanceQueryService`
- `InstanceIdentity`
- `InstanceIdentityReader`
- `createInstanceModule()`

## Compatibility

PR 02D translates inherited `SettingsDB.clientId()` into ChannelForge
`{ instanceId }` through the Tunarr compatibility boundary.

Instance does not import `SettingsDB`, Inversify, Fastify, LowDB, or
compatibility implementations directly.

## Persistence

No Instance persistence is introduced by PR 02E.

## Migration Status

Shell established. Broader settings, setup lifecycle, feature flags,
locale, time zone, and public-base-URL behavior remain deferred.
