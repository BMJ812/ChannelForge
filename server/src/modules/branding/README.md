# Branding Module

## Purpose

Branding owns reusable ChannelForge visual and on-air presentation
configuration.

## Public Interface

- `BrandingProfileId`
- `BrandingRevisionId`
- `BrandingTarget`
- `BrandingCommandService`
- `BrandingQueryService`
- `createBrandingModule()`

## Dependencies

Branding may reference Networks and Channels through their public identifiers.

## Forbidden Dependencies

Branding does not own managed file storage, FFmpeg filter construction,
schedule placement, or Network lifecycle.

## Persistence

No Branding persistence is introduced or migrated in this M02 unit.

## Runtime Migration

None.

## Migration Status

Shell established.
