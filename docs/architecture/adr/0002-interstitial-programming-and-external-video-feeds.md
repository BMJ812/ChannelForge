# ADR 0002: Interstitial Programming and External Video Feeds

- **Status:** Accepted
- **Date:** 2026-07-27
- **Decision owners:** ChannelForge maintainers
- **Related principle:** Build television networks, not playlists.

## Context

ChannelForge needs to support television presentation material that is shorter
than ordinary programs, including:

- Bumpers
- Commercials
- Promos
- Station identifications
- Public-service announcements
- Trailers
- Technical slates
- Short filler
- Network continuity material

A Channel may also need to follow an external publisher that releases new videos
regularly. A typical example is a YouTube Channel whose new uploads should be
discovered automatically and considered for future programming.

These capabilities are related because both introduce short-form or externally
discovered material into a Channel schedule. They are not the same domain
concept and must not share one overloaded implementation.

## Decision

ChannelForge will introduce two separate capabilities:

1. **Interstitial Programming**
2. **External Video Feeds**

Both capabilities will participate in the existing Catalog, programming,
scheduling, publication, and playout boundaries.

## Interstitial Programming

### Presentation Asset

A Presentation Asset is playable media used for Channel presentation rather
than as a normal episodic or feature program.

Initial Presentation Asset kinds:

- `BUMP`
- `COMMERCIAL`
- `PROMO`
- `STATION_ID`
- `PSA`
- `TRAILER`
- `FILLER`
- `TECHNICAL_SLATE`
- `OFF_AIR_SLATE`

A Presentation Asset may be:

- A user-managed local media file
- A managed upload
- A media item exposed by a supported Media Source
- A remotely hosted media object whose owner expressly permits direct playback
- A metadata-only external reference that is not eligible for playout

### Presentation Asset Fields

Conceptual fields:

```text
presentationAssetId
kind
title
description
duration
sourceType
sourceReference
rightsStatus
playabilityStatus
tags
networkScope
channelScope
validFrom
validUntil
maximumTotalPlays
maximumPlaysPerDay
minimumRepeatInterval
activeState
createdAt
updatedAt
version
```

### Rights Status

Suggested values:

- `USER_OWNED`
- `LICENSED`
- `PUBLIC_DOMAIN`
- `PROVIDER_AUTHORIZED`
- `UNKNOWN`
- `RESTRICTED`

`UNKNOWN` and `RESTRICTED` assets are not automatically eligible for playout.

### Playability Status

Suggested values:

- `PLAYABLE`
- `METADATA_ONLY`
- `REQUIRES_LOCAL_COPY`
- `TEMPORARILY_UNAVAILABLE`
- `BLOCKED_BY_POLICY`

### Interstitial Pool

An Interstitial Pool groups Presentation Assets for deterministic selection.

Conceptual fields:

```text
interstitialPoolId
name
networkId
channelId
allowedKinds
requiredTags
excludedTags
selectionPolicy
repeatPolicy
durationPolicy
activeState
version
```

### Break Rule

A Break Rule defines where and how an Interstitial Pool may be used.

Initial placement types:

- Before a program
- After a program
- Between episodes
- At a block boundary
- At a daypart boundary
- At an exact local-time boundary
- Inside a planned break window
- To fill a bounded schedule gap
- Before or after a fixed event

Conceptual fields:

```text
breakRuleId
programmingConfigurationRevisionId
placementType
poolId
minimumDuration
targetDuration
maximumDuration
maximumItems
frequencyCap
cooldown
priority
hardOrSoft
activeState
version
```

### Deterministic Selection

Interstitial selection must be deterministic.

The same:

- Programming Configuration Revision
- Catalog Snapshot
- Interstitial Pool state
- Schedule horizon
- Rule versions
- Seed

must produce the same Presentation Asset placements and evidence.

### Commercial Terminology

`COMMERCIAL` is one Presentation Asset kind.

ChannelForge will use **Interstitial Programming** as the umbrella domain term
because not every break item is an advertisement.

No advertising marketplace, billing system, impression auction, or revenue
accounting is required for version 1.

## External Video Feeds

### External Feed

An External Feed represents a publisher-controlled stream of newly released
video metadata.

Initial feed kinds:

- `YOUTUBE_CHANNEL`
- `YOUTUBE_PLAYLIST`
- `RSS_VIDEO`
- `ATOM_VIDEO`
- `GENERIC_PROVIDER_FEED`

Conceptual fields:

```text
externalFeedId
feedKind
displayName
providerReference
sourceUrl
credentialReference
syncPolicy
defaultEligibilityPolicy
networkScope
channelScope
activeState
lastSuccessfulSyncAt
nextSyncAt
version
```

### External Feed Item

An External Feed Item represents one discovered external publication.

Conceptual fields:

```text
externalFeedItemId
externalFeedId
providerItemId
title
description
publishedAt
duration
thumbnailReference
publisherName
canonicalWatchUrl
embeddable
playabilityStatus
rightsStatus
catalogItemId
firstDiscoveredAt
lastObservedAt
availabilityState
```

### Feed Synchronization

A feed synchronization job may:

1. Resolve the provider identity.
2. Read new items.
3. Normalize metadata.
4. Deduplicate by qualified provider identity.
5. Create or update External Feed Items.
6. Associate an existing Catalog Item when appropriate.
7. Create an operator-visible discovery item.
8. Evaluate scheduling eligibility.
9. Record removals or unavailable items.
10. Produce a synchronization report.

Feed synchronization does not make an item playable by itself.

### YouTube Discovery

A YouTube adapter may use the official YouTube Data API to:

- Resolve a Channel ID
- Resolve the Channel uploads playlist
- List newly uploaded videos
- Read public metadata
- Detect removed or private items
- Maintain a synchronization cursor or last-observed boundary

The adapter must not scrape YouTube HTML as its primary contract.

### YouTube Playback Boundary

A YouTube URL is not a direct media source for ChannelForge IPTV playout.

ChannelForge core will not:

- Download YouTube videos without express authorization
- Use extraction tools to bypass YouTube delivery controls
- Convert an embedded YouTube player into an FFmpeg input
- Remove YouTube branding, controls, advertisements, or required metadata
- Restream YouTube audiovisual content through XMLTV/M3U/HDHomeRun output merely
  because a public watch URL exists

A YouTube item may have one of these modes:

#### Discovery Only

- Metadata is synchronized.
- The item appears in an inbox or Catalog discovery view.
- The user may open the canonical YouTube watch page.
- The item is not eligible for linear playout.

#### Web-Player Eligible

- The item may be played through the official YouTube embedded player in a
  ChannelForge web-only experience.
- This mode is not equivalent to Plex, Jellyfin, Emby, M3U, or HDHomeRun output.
- YouTube player requirements remain visible and unmodified.

#### Linear-Playout Eligible

The item becomes eligible for ChannelForge linear output only when ChannelForge
has a separate authorized playable source, such as:

- A user-owned local original
- A licensed downloadable file
- A creator-provided direct media enclosure
- A supported Media Source copy
- Another provider contract that expressly permits playback and restreaming

The YouTube identity may remain metadata provenance for that playable copy.

### Automatic Programming Modes

An External Feed may use one of these policies:

- `DISCOVERY_INBOX`
- `AUTO_CREATE_CATALOG_CANDIDATE`
- `AUTO_ADD_WHEN_PLAYABLE`
- `AUTO_SCHEDULE_WHEN_PLAYABLE`
- `MANUAL_APPROVAL_REQUIRED`

The default is `DISCOVERY_INBOX`.

### Scheduling Policy

A Feed Item is schedule-eligible only when:

- It has a canonical Catalog Item or Presentation Asset identity.
- Its duration is known or bounded.
- It has a playable source.
- Rights and policy permit playout.
- It passes Channel filters.
- It is not removed, private, blocked, or expired.
- It satisfies age, tag, and content restrictions.
- Its provider metadata is fresh enough.

### Example Use Case

A Channel follows a creator who publishes one video every Friday.

ChannelForge:

1. Polls the creator's official uploads feed.
2. Discovers the new video.
3. Adds it to the Channel's discovery inbox.
4. Matches it to a local or licensed copy when available.
5. Applies duration and tag filters.
6. Makes the playable copy eligible for the next configured programming block.
7. Records the provider identity and publication time as provenance.

## BumpWorthy Boundary

BumpWorthy may be used by an operator as a research and curation reference.

ChannelForge will not ship a BumpWorthy scraper or downloader in core.

A BumpWorthy URL may be stored as:

- A source reference
- A research note
- A metadata provenance link
- A manual curation aid

It does not establish playback rights.

Operators may add locally held or otherwise authorized bump media as
Presentation Assets and use BumpWorthy tags or descriptions only when their use
is lawful and permitted.

## Security

External Feed and remote-asset support must include:

- URL validation
- SSRF controls
- Redirect limits
- Response-size limits
- Content-type validation
- Credential isolation
- API-key redaction
- Rate limiting
- Provider quota handling
- Removal and privacy-state handling
- No arbitrary shell execution
- No automatic download from unsupported providers

## Availability and Failure

External content may disappear.

Schedule generation must not depend on an external item unless a playable source
is confirmed in the planning snapshot.

If a playable item becomes unavailable after publication, runtime recovery uses
the existing fallback policy and records the actual Airing Record. It does not
rewrite the approved Schedule Plan.

## Architecture Impact

### Terminology Specification

Add:

- Presentation Asset
- Interstitial Pool
- Break Rule
- External Feed
- External Feed Item
- Discovery Inbox
- Playability Status
- Rights Status

### Domain Model Specification

Add aggregates or entities for:

- Presentation Asset
- Interstitial Pool
- External Feed
- External Feed Item

Break Rules remain part of Programming Configuration revisions.

### Media Catalog Specification

Add:

- External metadata provenance
- Metadata-only items
- Playability status
- Rights status
- Feed-to-Catalog matching
- Presentation Asset indexing

### Scheduling Specification

Add:

- Break placement rules
- Deterministic Interstitial Pool selection
- Duration targeting
- Frequency caps
- Repeat cooldowns
- Feed-item eligibility snapshots
- Evidence for every selected Presentation Asset

### Playout and Output Specification

Add:

- Presentation Asset playback
- Break transitions
- Runtime fallback for unavailable assets
- Explicit exclusion of metadata-only external items
- Web-only embedded-player mode as a separate output class if implemented

### Integrations Specification

Add:

- YouTube Data API discovery adapter
- RSS and Atom feed adapter contracts
- Provider quota and cursor behavior
- Provider deletion and privacy transitions

### API Specification

Add management resources for:

- Presentation Assets
- Interstitial Pools
- Break Rules
- External Feeds
- Feed synchronization
- Discovery Inbox
- Eligibility and policy decisions

### Plugin Specification

Permit third-party External Feed adapters through a bounded extension point.

### Security Specification

Add:

- Remote-feed SSRF controls
- Provider API credential handling
- External URL redaction
- Rights and playability policy enforcement

## Implementation Roadmap Impact

### Milestone 01

Inventory inherited Tunarr behavior related to:

- Filler
- Flex
- Commercial-like content
- Bumpers
- Custom shows
- Remote URLs
- YouTube or web-video integrations

No new runtime behavior is added in Milestone 01.

### Milestone 05

Implement:

- Presentation Asset source association
- External Feed
- External Feed Item
- YouTube metadata adapter
- Feed synchronization
- Playability and rights status
- Feed-to-Catalog matching

### Milestone 06

Implement:

- Network- and Channel-scoped Interstitial Pools
- Break Rules in Programming Configuration revisions
- Feed assignment to Networks and Channels

### Milestone 07

Implement:

- Deterministic break insertion
- Duration targeting
- Frequency caps
- Cooldowns
- Feed-item eligibility snapshots
- Selection evidence

### Milestone 08

Implement:

- Presentation Asset playout
- Break continuity
- Fallback behavior
- Airing Records
- Explicit web-only YouTube mode if approved
- No unsupported YouTube restream path

### Milestone 09

Implement:

- Presentation Asset UI
- Interstitial Pool UI
- Break Rule UI
- External Feed UI
- Discovery Inbox
- YouTube API credentials
- Permissions and audit
- Plugin adapter boundary

### Milestone 10

Validate:

- Feed synchronization under Docker and Unraid
- Quota and credential failure
- Remote URL security
- Interstitial scheduling determinism
- Break continuity
- External item disappearance
- Support documentation

## Version 1 Scope

Version 1 should include:

- Local and Media Source-backed Presentation Assets
- Interstitial Pools
- Break Rules
- Deterministic insertion
- Commercial, bump, promo, ID, PSA, trailer, filler, and slate kinds
- External Feed metadata synchronization
- YouTube Channel and playlist discovery through the official API
- Discovery Inbox
- Auto-add and auto-schedule only when a separate playable source exists
- Rights and playability status
- Operator-visible failures

Version 1 should not include:

- Core YouTube downloading
- YouTube stream extraction
- YouTube-to-FFmpeg restreaming
- Hidden or modified YouTube embeds
- BumpWorthy scraping or downloading
- Advertising marketplace
- Billing
- Impression sales
- Revenue reporting
- Automatic assumption of playback rights

## Consequences

### Positive

- Adult Swim-style bumps become a first-class programming capability.
- Commercials and promos use the same controlled scheduling machinery.
- External publishers can feed newly released metadata into ChannelForge.
- Automatic programming remains deterministic.
- Rights and playability are explicit.
- Provider integrations remain bounded.
- Plex, Jellyfin, Emby, M3U, and HDHomeRun output remain legally and technically
  distinct from browser-only embeds.

### Negative

- A public YouTube watch URL does not automatically become playable Channel
  media.
- Users need local, licensed, or otherwise authorized media for linear playout.
- Feed synchronization adds provider quota and credential management.
- Break programming increases scheduler complexity.
- Rights and availability status require operator-visible workflow.

### Neutral

- This decision does not require paid advertising support.
- This decision does not require a plugin marketplace.
- This decision does not change the inherited runtime during Milestone 01.

## Decision Status

This ADR remains **Proposed** until:

1. The scope is reviewed.
2. The architecture specification amendments are prepared.
3. The implementation roadmap amendments are prepared.
4. Version 1 boundaries are accepted.
5. The ADR is merged into `main`.
