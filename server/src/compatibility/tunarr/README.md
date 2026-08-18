# Tunarr Compatibility Boundary

This namespace is the temporary anti-corruption boundary between inherited
Tunarr implementation and ChannelForge-owned concepts.

## Rules

- Compatibility adapters may depend on inherited Tunarr implementation.
- New ChannelForge code must use declared compatibility ports.
- Persistence records and inherited DTOs must not escape through ports.
- Compatibility use must remain measurable and removable.

## Current Adapters

`TunarrInstanceIdentityAdapter` translates the inherited SettingsDB
`clientId` read into the ChannelForge concept `instanceId`.

`TunarrMediaSourceSynchronizationAdapter` translates ChannelForge Media
Sources synchronization requests into the inherited media-source scan
coordinator without exposing legacy scanner or database types.

## Usage Evidence

Compatibility activity is measured with process-local counters.

- `instance-identity-read` records inherited instance identity reads.
- `media-source-synchronization-request` records synchronization requests
  delegated to the inherited scan coordinator.

These counters are diagnostic migration evidence and are not durable
product state.
