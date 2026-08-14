# Tunarr Compatibility Boundary

This namespace is the temporary anti-corruption boundary between inherited
Tunarr implementation and ChannelForge-owned concepts.

## Rules

- Compatibility adapters may depend on inherited Tunarr implementation.
- New ChannelForge code must use declared compatibility ports.
- Persistence records and inherited DTOs must not escape through ports.
- Compatibility use must remain measurable and removable.

## Initial Port

`TunarrInstanceIdentityPort` translates the inherited SettingsDB `clientId`
read into the ChannelForge concept `instanceId`.

## Usage Evidence

Each read through the initial adapter increments the process-local
`instance-identity-read` compatibility counter.

The counter is diagnostic migration evidence and is not durable product state.
