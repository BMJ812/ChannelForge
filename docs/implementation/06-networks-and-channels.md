# Milestone 06: Networks and Channels

- **Roadmap version:** 0.1
- **Milestone status:** Draft
- **Last updated:** 2026-07-27
- **Risk classification:** Core Domain / High
- **Implementation authority:** Network, Channel, profile revisions, programming configuration revisions, branding ownership, and legacy Channel migration

## Purpose

This milestone implements the network-first editorial model that distinguishes
ChannelForge from playlist-oriented virtual television tools.

It defines:

- Network aggregate implementation
- Channel aggregate implementation
- Network ownership
- Channel ownership
- Network Profile Revisions
- Channel Profile Revisions
- Editorial Profile
- Audience Profile
- Branding Profile Revisions
- Presentation Asset assignments
- Programming Configuration Revisions
- Dayparts
- Programming Blocks
- Rule Sets
- Catalog Selectors
- Network defaults
- Channel overrides
- Channel numbering
- Canonical Output Identity
- Guide identity
- Channel time zones
- Time-zone overrides
- Time-shifted Channels
- Lifecycle transitions
- Activation and archival
- Revision creation and activation
- Revision overlays
- Legacy Channel migration
- Default Network creation
- Legacy schedule-configuration migration
- Compatibility reads and writes
- API foundations
- UI foundations
- Validation
- Audit
- Testing
- Pull-request sequencing
- Entry and completion gates
- Rollback
- Risks
- Deferred decisions

This milestone does not implement the deterministic scheduling algorithm.

It creates the complete editorial and configuration input consumed by that
algorithm.

## Governing Specifications

This milestone is governed by:

- `docs/architecture/spec/01-terminology.md`
- `docs/architecture/spec/02-system-context.md`
- `docs/architecture/spec/03-domain-model.md`
- `docs/architecture/spec/04-scheduling-model.md`
- `docs/architecture/spec/05-media-catalog.md`
- `docs/architecture/spec/06-playout-and-output.md`
- `docs/architecture/spec/08-persistence.md`
- `docs/architecture/spec/09-api.md`
- `docs/architecture/spec/10-plugins.md`
- `docs/architecture/spec/11-security.md`
- `docs/architecture/spec/12-deployment.md`
- `docs/architecture/spec/13-testing.md`
- `docs/architecture/spec/14-migration.md`
- `docs/architecture/spec/15-interstitial-programming-and-external-video-feeds.md`
- `docs/implementation/README.md`
- `docs/implementation/01-baseline-and-change-control.md`
- `docs/implementation/02-module-boundaries.md`
- `docs/implementation/03-identity-persistence-and-migrations.md`
- `docs/implementation/04-legacy-compatibility.md`
- `docs/implementation/05-media-sources-and-catalog.md`

## Milestone Mission

ChannelForge must model television Networks as durable editorial identities and
Channels as tuneable output feeds.

The Networks and Channels milestone must:

- Establish Network as the editorial owner
- Establish Channel as the output-facing broadcast identity
- Keep Network and Channel identity stable
- Separate human-readable names from canonical IDs
- Make profile changes revisioned
- Make programming configuration revisioned
- Make activated revisions immutable
- Preserve one active revision per configuration type
- Permit explicit Channel overrides
- Prevent Channel overrides from mutating Network revisions
- Keep channel numbering stable
- Keep XMLTV, M3U, and HDHomeRun identity aligned
- Preserve time-zone semantics
- Preserve schedule history through changes
- Preserve inherited Channel configuration
- Avoid automatic destructive renumbering
- Keep seasonal programming available for ordinary year-round rotation unless
  an explicit hard exclusion is configured
- Support seasonal boosts and seasonal blocks without making seasonal titles
  disappear from the normal Catalog
- Prepare immutable inputs for deterministic scheduling
- Keep live playout outside editorial configuration
- Keep provider IDs outside Network and Channel configuration
- Keep migration reversible
- Make every important editorial change auditable

## Product Principle

The governing product principle is:

> Build television networks, not playlists.

A Network is not a list of media.

A Network is an editorial identity with:

- Mission
- Audience
- Content boundaries
- Programming preferences
- Scheduling policies
- Branding
- Dayparts
- Blocks
- Rules
- One or more Channels

A Channel is not the Network.

A Channel is a numbered or otherwise addressable output feed operating under one
Network.

## Core Principles

1. A Network owns editorial identity.
2. A Channel owns tuneable output identity.
3. A Channel belongs to one Network in version 1.
4. A Network may own multiple Channels.
5. Network and Channel IDs are ChannelForge-owned.
6. Names, slugs, numbers, and call signs are mutable human-facing keys.
7. Activated profile revisions are immutable.
8. Activated Programming Configuration Revisions are immutable.
9. A Schedule Plan records every revision used.
10. Channel overrides are explicit overlays.
11. Channel overrides do not mutate Network revisions.
12. Output adapters use one canonical Output Identity.
13. Time-zone context is explicit.
14. Persisted instants remain UTC.
15. Dayparts use local editorial time.
16. Seasonal programming is policy, not Catalog deletion.
17. Seasonal titles remain available year-round unless explicitly excluded.
18. Approved Schedule Plans remain immutable.
19. Archival preserves history.
20. Legacy migration preserves user intent.

## Scope

Version 1 includes:

- Network creation
- Network profile revisions
- Editorial profiles
- Audience profiles
- Branding profiles
- Presentation assets
- Channel creation
- Channel numbers
- Channel profile revisions
- Channel time-zone overrides
- Output identities
- Output configuration references
- Programming Configuration Revisions
- Dayparts
- Programming Blocks
- Rule Sets
- Catalog Selectors
- Filler policies
- Repeat policies
- Seasonal programming policies
- Network defaults
- Channel overlays
- Activation
- Pause
- Maintenance
- Archive
- Restore
- Legacy Channel migration
- Default Network assignment
- Schedule input snapshots
- API and UI foundations

## Non-Goals

This milestone does not require:

- Final schedule-generation algorithm
- Final schedule optimizer
- Final playout runtime
- Final FFmpeg construction
- Final XMLTV generator
- Final M3U generator
- Final HDHomeRun server
- Final public release UI
- Per-viewer personalization
- Behavioral tracking of viewers
- Multi-tenant Network ownership
- Multi-Network Channel membership
- Distributed programming editors
- Live collaborative editing
- Automatic content acquisition
- Automatic creative branding generation
- Dynamic ad sales
- Ratings measurement
- External broadcast automation integration
- Removal of every inherited Channel table
- Legacy output cutover
- Legacy schedule writer deletion

## Domain Distinction

## Network

A Network is a persistent editorial and programming identity.

Examples:

- Horror Network
- Family Animation Network
- Classic Cinema Network
- Science Fiction Network
- Saturday Morning Network
- Documentary Network

A Network may have one or more Channels.

## Channel

A Channel is a tuneable output feed.

Examples:

- Channel 7
- Channel 7.1
- Channel 102
- East feed
- West feed
- Standard-definition compatibility feed
- Event feed

## Network Is Not a Channel

A Network does not directly own:

- Stream session
- FFmpeg process
- Client connection
- Tuner allocation
- Stream URL
- Live playback offset

## Channel Is Not a Network

A Channel does not independently redefine:

- Network mission
- Audience identity
- Network editorial philosophy
- Shared Network profile
- Shared Catalog policy

A Channel may apply explicit overrides.

## Network Module Ownership

The Networks module owns:

- Network
- Network lifecycle
- Network slug
- Network Profile Revision
- Editorial Profile
- Audience Profile
- Network defaults
- Active revision references
- Network-level policy
- Network archive state
- Network template lineage
- Network health-target references

## Channels Module Ownership

The Channels module owns:

- Channel
- Channel lifecycle
- Channel number
- Channel Profile Revision
- Canonical Output Identity
- Guide identity
- Tuner lineup identity
- Time-zone override
- Time-shift policy
- Output-configuration reference
- Active publication reference
- Channel branding override reference
- Channel programming override reference

## Branding Module Ownership

The Branding module owns:

- Branding Profile
- Branding Profile Revision
- Presentation Asset
- Asset Assignment
- Logo reference
- Wordmark reference
- Color palette
- Typography
- On-screen identity policy
- Bumper policy
- Ident policy
- Watermark policy
- Guide-image policy

## Programming Module Ownership

The Programming module owns:

- Programming Configuration
- Programming Configuration Revision
- Daypart
- Programming Block
- Rule Set
- Programming Rule
- Catalog Selector
- Repetition policy
- Timing policy
- Filler policy
- Randomization policy
- Seasonal policy
- Override overlay
- Activation validation

## Scheduling Module Dependency

Scheduling consumes:

- Network ID
- Channel ID
- Network Profile Revision ID
- Channel Profile Revision ID
- Branding Profile Revision ID
- Programming Configuration Revision ID
- Channel override revision IDs
- Catalog Snapshot ID
- Time zone
- Planning horizon
- Seed
- Algorithm version

Scheduling does not mutate these inputs.

## Network Aggregate

A Network represents the editorial identity of a virtual television network.

## Network Fields

Required conceptual fields:

```text
networkId
slug
status
primaryTimeZone
activeNetworkProfileRevisionId
activeProgrammingConfigurationRevisionId
activeBrandingProfileRevisionId
defaultCatalogPolicyId
templateApplicationReference
createdAt
updatedAt
archivedAt
version
```

## Network ID

`networkId` is:

- Opaque
- Stable
- ChannelForge-owned
- Independent of slug
- Independent of display name
- Independent of legacy Channel ID
- Independent of provider ID

## Network Slug

A Network slug is a human-readable key.

## Slug Rules

A slug should be:

- Lowercase
- URL-safe
- Stable enough for operator recognition
- Unique among non-archived Networks
- Mutable through controlled command
- Redirectable or aliasable where public routes use it

## Slug Is Not Identity

Changing the slug does not change `networkId`.

## Network Status

Suggested states:

- `DRAFT`
- `ACTIVE`
- `PAUSED`
- `ARCHIVED`

## Draft Network

A Draft Network:

- May have no active Channel
- May have incomplete branding
- May have draft Programming Configuration
- Cannot publish live output
- Can be previewed
- Can be deleted only when never referenced and policy permits

## Active Network

An Active Network:

- Has a valid primary time zone
- Has at least one non-archived Channel
- Has an active Network Profile Revision
- Has an active Programming Configuration Revision
- Has no blocking validation error
- May publish schedules through its Channels

## Paused Network

A Paused Network:

- Preserves identity
- Preserves active revisions
- Preserves Channels
- Preserves approved schedules
- Prevents new publication or playout according to policy
- May continue guide display according to policy
- May be resumed

## Archived Network

An Archived Network:

- Is removed from ordinary active lists
- Cannot create new active schedules
- Preserves Channels
- Preserves profile revisions
- Preserves Programming Configuration Revisions
- Preserves Branding revisions
- Preserves schedules
- Preserves audit
- Preserves migration mapping
- Requires explicit restore

## Network Lifecycle Transitions

Allowed transitions:

```text
DRAFT -> ACTIVE
DRAFT -> ARCHIVED
ACTIVE -> PAUSED
ACTIVE -> ARCHIVED
PAUSED -> ACTIVE
PAUSED -> ARCHIVED
ARCHIVED -> DRAFT
ARCHIVED -> PAUSED
```

Exact restore target depends on validation.

## Network Activation

Activation validates:

- Name
- Slug
- Time zone
- Active Network Profile Revision
- Active Programming Configuration Revision
- Branding policy
- At least one eligible Channel
- Channel number uniqueness
- Catalog policy
- Required permissions
- No blocking migration conflict

## Network Archive

Archiving a Network does not hard-delete its Channels.

## Network Restore

Restore validates:

- Slug uniqueness
- Channel number conflicts
- Time-zone validity
- Revision availability
- Branding assets
- Programming rules
- Catalog selectors
- Legacy compatibility state

## Network Profile

The Network Profile describes durable Network identity.

## Network Profile Revision Fields

```text
networkProfileRevisionId
networkId
revisionNumber
status
displayName
shortName
description
callSignOrBrandCode
editorialMission
audienceProfile
editorialProfile
defaultLanguage
defaultContentRatingPolicy
defaultSchedulingCharacteristics
defaultGuideDescriptionPolicy
createdAt
createdBy
activatedAt
supersededAt
contentHash
```

## Network Profile Revision Status

- `DRAFT`
- `ACTIVE`
- `SUPERSEDED`
- `ARCHIVED`
- `INVALID`

## Revision Creation

A new revision may be created from:

- Current active revision
- Prior revision
- Template application
- Imported legacy configuration
- Blank defaults
- Another Network copy operation

## Revision Activation

Activation:

1. Validates content.
2. Calculates canonical hash.
3. Verifies expected active revision.
4. Marks current active revision superseded.
5. Activates new revision atomically.
6. Updates Network active reference.
7. Records audit.
8. Emits event.
9. Marks dependent draft plans stale where required.
10. Does not mutate approved plans.

## Activated Revision Immutability

After activation, profile content cannot change.

Corrections create a new revision.

## Network Display Name

Display Name is stored in the Network Profile Revision.

Changing it creates a new revision.

## Short Name

Short Name supports constrained output and UI surfaces.

## Call Sign or Brand Code

This value is editorial branding.

It is not the canonical Channel ID.

## Editorial Mission

The Editorial Mission states the Network's programming purpose.

Examples:

- Showcase supernatural horror across film and episodic television
- Present family-safe animation throughout the day
- Run classic cinema with curated evening blocks
- Provide science-fiction programming with franchise marathons

The mission is descriptive and may inform future recommendations.

It does not directly execute scheduling.

## Editorial Profile

The Editorial Profile defines what belongs on the Network.

## Editorial Profile Fields

Potential fields:

- Preferred genres
- Excluded genres
- Preferred eras
- Excluded eras
- Allowed media kinds
- Desired novelty
- Desired familiarity
- Franchise behavior
- Series-completion behavior
- Movie-to-episode balance
- Seasonal behavior
- Content-rating limits
- Original-programming labels
- Network-specific labels
- Repeat tolerance
- Short-form tolerance
- Presentation-media policy

## Editorial Profile Semantics

Editorial Profile values are defaults and guidance.

Hard constraints belong in explicit Programming Rules.

## Preferred Genre

A preferred genre increases eligibility score or selector priority.

It does not necessarily exclude other genres.

## Excluded Genre

An excluded genre is effective only when represented as an explicit hard
constraint or Catalog policy.

## Seasonal Behavior

Seasonal programming supports:

- Seasonal boost
- Seasonal block
- Seasonal premiere window
- Seasonal collection
- Seasonal branding
- Seasonal repeat adjustment
- Holiday-specific daypart
- Temporary priority increase

## Seasonal Availability Rule

Seasonal programming metadata does not remove titles from ordinary year-round
rotation by default.

A holiday or seasonal title remains eligible outside its season unless:

- An explicit hard exclusion is configured
- A selector is intentionally season-only
- The operator disables ordinary eligibility
- Content availability changes

## Seasonal Boost

A seasonal boost may increase:

- Candidate score
- Block priority
- Collection priority
- Repeat tolerance
- Branding assignment
- Promotional frequency

The boost is evaluated in a specified local date range and time zone.

## Seasonal Hard Window

A season-only rule must be explicit and visibly classified as a hard
constraint.

## Seasonal Overlap

A title may belong to:

- Ordinary rotation
- Seasonal collection
- Holiday block
- Franchise block
- Manual collection

These memberships are not mutually exclusive.

## Audience Profile

The Audience Profile describes intended viewers.

## Audience Profile Fields

- General audience description
- Age-band constraints
- Household suitability
- Language expectations
- Desired pacing
- Desired repeat tolerance
- Daypart-specific suitability
- Content sensitivity
- Accessibility preferences

## Privacy Rule

Audience Profile is editorial configuration.

It must not become behavioral tracking of actual viewers without separate
approved privacy architecture.

## Network Relationships

A Network:

- Has one active Network Profile Revision
- Has one active Programming Configuration Revision
- Has zero or one active Branding Profile Revision
- Owns one or more Channels when active
- Has historical Schedule Plans through Channels
- Has Health Snapshots
- May originate from Template Snapshot
- May reference shared Presentation Assets

## Network Invariants

1. An active Network has at least one non-archived Channel.
2. An active Network has one valid IANA time zone.
3. Network identity changes create a new profile revision.
4. Archiving preserves Channels and history.
5. Programming rules use Catalog concepts, not provider IDs.
6. Recommendations cannot silently mutate Network state.
7. Template changes cannot silently mutate an existing Network.
8. Active slugs are unique.
9. Active revision references resolve.
10. Activated revisions are immutable.
11. Network defaults do not retroactively alter approved plans.
12. Seasonal labels do not remove year-round eligibility automatically.

## Channel Aggregate

A Channel represents a tuneable broadcast output.

A Channel belongs to exactly one Network in version 1.

## Channel Fields

```text
channelId
networkId
status
channelNumber
activeChannelProfileRevisionId
activeSchedulePublicationId
outputConfigurationReference
brandingOverrideRevisionId
programmingOverrideRevisionId
timeZoneOverride
timeShiftPolicy
createdAt
updatedAt
archivedAt
version
```

## Channel ID

`channelId` is:

- Opaque
- Stable
- ChannelForge-owned
- Independent of Channel number
- Independent of guide ID
- Independent of tuner lineup ID
- Independent of legacy Channel ID
- Independent of provider identity

## Channel Status

Suggested states:

- `DRAFT`
- `ACTIVE`
- `PAUSED`
- `MAINTENANCE`
- `ARCHIVED`

## Draft Channel

A Draft Channel:

- May have provisional number
- May have no active publication
- Cannot be exposed as active output
- Can be previewed
- May be deleted if never referenced

## Active Channel

An Active Channel:

- Belongs to active or paused Network according to policy
- Has unique number within output scope
- Has active Channel Profile Revision
- Has canonical Output Identity
- Has output configuration
- May have active publication
- Has no blocking validation conflict

## Paused Channel

A Paused Channel:

- Preserves active publication
- Preserves schedule
- Prevents or suspends live playout according to policy
- May remain in guide according to policy
- Can resume without regenerating identity

## Maintenance Channel

A Maintenance Channel:

- Preserves identity
- May serve slate or maintenance output
- May remain in guide
- Does not rewrite approved schedule
- Records operator action
- Has explicit fallback behavior

## Archived Channel

An Archived Channel:

- Is excluded from active lineup
- Preserves number history
- Preserves Output Identity
- Preserves guide history
- Preserves Schedule Plans
- Preserves publications
- Preserves playout history
- Preserves migration mapping
- Requires explicit restore

## Channel Lifecycle Transitions

```text
DRAFT -> ACTIVE
DRAFT -> ARCHIVED
ACTIVE -> PAUSED
ACTIVE -> MAINTENANCE
ACTIVE -> ARCHIVED
PAUSED -> ACTIVE
PAUSED -> MAINTENANCE
PAUSED -> ARCHIVED
MAINTENANCE -> ACTIVE
MAINTENANCE -> PAUSED
MAINTENANCE -> ARCHIVED
ARCHIVED -> DRAFT
ARCHIVED -> PAUSED
```

## Channel Activation

Activation validates:

- Owning Network
- Network status
- Channel Profile Revision
- Channel number
- Number uniqueness
- Output Identity
- Time zone
- Output configuration
- Branding override
- Programming override
- Access policy
- Legacy mapping
- Client compatibility limits

## Channel Profile Revision

The Channel Profile describes output-facing Channel identity.

## Channel Profile Revision Fields

```text
channelProfileRevisionId
channelId
revisionNumber
status
displayName
shortName
callSign
description
guideDisplayName
guideDescriptionPolicy
logoOverrideReference
languageOverride
contentRatingOverride
createdAt
createdBy
activatedAt
supersededAt
contentHash
```

## Channel Profile Revision Rule

An activated Channel Profile Revision is immutable.

## Channel Profile Inheritance

Effective Channel profile may derive from:

1. Channel-specific revision
2. Network Profile defaults
3. Instance defaults

The resulting effective profile must be reproducible.

## Channel Profile Override

A Channel override must identify:

- Overridden field
- Base Network revision
- Override value
- Actor
- Created timestamp
- Revision
- Removal behavior

## Override Removal

Removing an override restores inheritance from the active Network revision.

It does not restore a copied stale value.

## Channel Number

Channel Number is a value object.

## Channel Number Fields

```text
major
minor
canonicalDisplay
sortKey
```

## Channel Number Examples

- `7`
- `7.1`
- `102`
- `500.25`

## Channel Number Parsing

Parsing must distinguish:

- Major-only
- Major and minor
- Invalid punctuation
- Leading zero policy
- Negative
- Fractional ambiguity
- Overflow
- Client-incompatible value

## Channel Number Canonicalization

Canonical display must be deterministic.

## Channel Number Storage

Store structured major and optional minor values.

Do not rely only on a display string.

## Channel Number Scope

Active Channel number uniqueness applies within configured output scope.

Version 1 default scope:

```text
one active ChannelForge instance
```

A future output-profile-specific scope may be introduced only through explicit
design.

## Channel Number Uniqueness

Two active Channels cannot share the same canonical number in the same scope.

Archived Channels may preserve historical numbers.

## Channel Number Change

Changing a number:

- Preserves Channel ID
- Creates audit
- Updates canonical Output Identity revision
- Regenerates output artifacts
- May affect client lineup
- Does not rewrite approved Schedule Entries
- May require operator warning

## Renumbering Prohibition

Migration must not automatically renumber a legacy Channel unless:

- A conflict exists
- An explicit migration policy is selected
- The operator approves or policy is pre-approved
- Old and new values are recorded
- Client impact is shown

## Number Conflict

A number conflict may be resolved by:

- Preserve first and renumber second
- Assign minor number
- Keep one Channel inactive
- Use operator-selected number
- Split output scope in a future supported design

No resolution is guessed silently.

## Call Sign

Call Sign is human-facing.

It is not canonical identity.

## Canonical Output Identity

Every published Channel has one canonical Output Identity.

## Output Identity Fields

```text
channelId
guideChannelId
tunerLineupId
displayNumber
displayName
logoReference
identityRevision
```

## Output Identity Rule

XMLTV, M3U, HDHomeRun-compatible endpoints, and stream routing derive from the
same Output Identity.

## Guide Channel ID

Guide ID must be:

- Stable
- Unique
- Compatible with XMLTV policy
- Mapped from legacy guide ID where preserving it is required
- Independent of provider ID
- Auditable when changed

## Tuner Lineup ID

Tuner lineup identity must map back to `channelId`.

## Output Adapter Prohibition

Output adapters must not invent separate canonical Channel IDs.

## Output Identity Revision

Output-facing mutable fields may use an identity revision.

Changes that may increment revision:

- Channel number
- Guide ID
- Display name
- Logo
- Tuner publication state
- Output policy

## Output Identity Compatibility

Changing output identity may affect:

- Plex Live TV
- Jellyfin Live TV
- Emby Live TV
- IPTV clients
- Guide mapping
- Cached lineup
- Existing bookmarks

The UI must warn before high-impact changes.

## Channel Output Configuration Reference

The Channel references output configuration.

Output configuration may include:

- Stream mode
- Transcode profile
- Fallback behavior
- Maximum sessions
- Guide publication state
- Tuner publication state
- Stream access policy
- Startup buffering policy
- Maintenance behavior

Milestone 06 stores the reference and ownership.

Milestone 08 implements final playout and output behavior.

## Channel Time Zone

A Channel normally inherits Network primary time zone.

## Time-Zone Override

A Channel may define an override when:

- It represents a regional feed
- It represents a time-shift feed
- Its editorial day differs
- Imported legacy semantics require it
- Operator explicitly configures it

## Time-Zone Precedence

1. Channel override
2. Network primary time zone
3. Instance default during migration only

An active Network must ultimately have an explicit valid primary time zone.

## IANA Time Zone

Use an IANA identifier.

Examples:

- `America/Los_Angeles`
- `America/New_York`
- `Europe/London`

Do not persist a bare numeric UTC offset as the editorial time zone.

## Persisted Time

All persisted instants remain UTC.

## Local Editorial Time

Local time applies to:

- Dayparts
- Weekdays
- Calendar dates
- Seasonal ranges
- Holidays
- Operator timeline display
- Effective ranges

## Daylight Saving Time

DST ambiguity must be explicit.

## DST Gap

A nonexistent local time may:

- Shift forward
- Skip occurrence
- Use configured policy
- Fail validation

Policy belongs to scheduling specification.

## DST Fold

A repeated local time requires:

- Earlier occurrence
- Later occurrence
- Both
- Explicit policy

## Time-Shifted Channel

A time-shifted Channel reuses editorial programming with a defined offset.

## Time-Shift Policy Fields

```text
sourceChannelId
offsetMinutes
effectiveTimeZone
publicationPolicy
guidePolicy
brandingPolicy
overridePolicy
```

## Time-Shift Rules

- Source Channel must belong to allowed Network scope
- Offset is explicit
- Output Identity remains distinct
- Channel ID remains distinct
- Schedule derivation is reproducible
- Time shift does not mutate source plan
- Guide times reflect shifted instants
- DST policy is explicit
- Branding may inherit or override
- Runtime uses separate publication identity

## Time-Shift Non-Goal

Milestone 06 defines configuration.

Milestone 07 and Milestone 08 define scheduling and playout realization.

## Branding Profile

A Branding Profile defines persistent visual and on-air identity.

It may be owned by:

- Network
- Channel override

## Branding Profile Revision Fields

```text
brandingProfileRevisionId
ownerType
ownerId
revisionNumber
status
logoAssetReference
wordmarkAssetReference
colorPalette
typographySettings
guideImagePolicy
onScreenGraphicPolicy
watermarkPolicy
identPolicy
bumperPolicy
createdAt
createdBy
activatedAt
supersededAt
contentHash
```

## Branding Revision Status

- `DRAFT`
- `ACTIVE`
- `SUPERSEDED`
- `ARCHIVED`
- `INVALID`

## Branding Activation

Activation validates:

- Asset existence
- Asset state
- MIME
- Dimensions
- Duration for timed assets
- Owner
- Hash
- Required accessibility metadata
- Output compatibility where known

## Branding Immutability

An activated Branding Profile Revision is immutable.

## Network Branding

Network branding is the default for its Channels.

## Channel Branding Override

Channel override may replace or augment:

- Logo
- Wordmark
- Color palette
- Typography
- Guide image
- Watermark
- Ident set
- Bumper set

## Override Invariant

Channel branding override does not mutate Network branding.

## Presentation Asset

Suggested kinds:

- Network logo
- Channel logo
- Wordmark
- Watermark
- Ident
- Bumper
- Interstitial
- Promo
- Rating card
- Technical difficulty card
- Slate
- Filler clip
- Guide image

## Presentation Asset Fields

```text
presentationAssetId
assetKind
managedStorageReference
mimeType
fileSize
durationMs
width
height
checksum
validationState
provenance
createdAt
archivedAt
```

## Asset Validation

An asset must be validated before activation.

## Asset Assignment

An Asset Assignment defines where and when an asset is eligible.

## Asset Assignment Fields

- Owner Network or Channel
- Asset ID
- Placement role
- Weight
- Valid date range
- Eligible dayparts
- Cooldown
- Priority
- Enabled state

## Seasonal Branding

Branding may vary by seasonal date range without replacing the active Network
identity.

## Seasonal Branding Rule

Seasonal branding assignment changes presentation eligibility.

It does not alter Catalog eligibility by itself.

## Branding Historical Preservation

Assets referenced by approved schedules or playout records remain retained
according to history policy.

## Programming Configuration

Programming Configuration defines how schedules should be generated.

## Programming Configuration Identity

A Programming Configuration has stable identity.

Its revisions are immutable snapshots.

## Programming Configuration Fields

```text
programmingConfigurationId
ownerNetworkId
createdAt
archivedAt
```

## Programming Configuration Revision Fields

```text
programmingConfigurationRevisionId
programmingConfigurationId
ownerNetworkId
optionalChannelId
revisionNumber
status
effectiveStart
effectiveEnd
dayparts
programmingBlocks
ruleSets
catalogSelectors
globalRepetitionPolicy
globalTimingPolicy
fillerPolicy
randomizationPolicy
seasonalPolicy
createdAt
createdBy
activatedAt
supersededAt
contentHash
```

## Programming Revision Status

- `DRAFT`
- `ACTIVE`
- `SUPERSEDED`
- `ARCHIVED`
- `INVALID`

## Programming Revision Ownership

A Network owns the base Programming Configuration.

A Channel may have an explicit overlay revision.

## Base and Overlay

Effective programming input is:

1. Active Network Programming Configuration Revision
2. Active Channel overlay revision
3. Explicit instance defaults copied into snapshot where allowed

## Overlay Rule

The Channel overlay:

- References base revision
- Contains only explicit differences
- Has its own revision ID
- Has deterministic merge semantics
- Cannot mutate base
- Is snapshotted into Schedule Plan inputs

## Overlay Conflicts

A base revision change may make an overlay:

- Valid
- Stale
- Conflicted
- Invalid

The system must validate before activation or schedule generation.

## Programming Revision Activation

Activation validates:

- Owner
- Effective range
- Dayparts
- Blocks
- Rules
- Selectors
- Catalog references
- Repeat policy
- Timing policy
- Filler policy
- Randomization policy
- Seasonal policy
- Overlay compatibility
- Human-readable explanations

## Use Immutability

A Programming Configuration Revision becomes immutable after:

- Activation, or
- Use in any Schedule Plan

## Draft Editing

Editing a draft does not alter active configuration.

## Clone Revision

A new draft may clone:

- Active revision
- Historical revision
- Template
- Imported legacy configuration
- Another Network
- Blank defaults

## Daypart

A Daypart is a named recurring local-time interval.

## Daypart Fields

```text
daypartId
name
daysOfWeek
startLocalTime
endLocalTime
priority
timeZoneInterpretation
dateRangeRestriction
enabledState
```

## Daypart Examples

- Weekday Morning
- Prime Time
- Late Night
- Saturday Cartoons
- Weekend Afternoon
- Overnight
- Holiday Evening

## Daypart Time Zone

Daypart local time is interpreted in effective Channel time zone unless an
explicit permitted override exists.

## Overnight Daypart

A Daypart may cross midnight.

Example:

```text
Late Night: 22:00 -> 02:00
```

The ownership date rule must be explicit.

## Daypart Overlap

Overlapping Dayparts require deterministic precedence.

## Daypart Precedence

Possible precedence inputs:

- Priority
- Specific date range
- Channel overlay
- Explicit block priority
- Stable ID tie-break

## Daypart Validation

Validate:

- Day selection
- Time format
- Zero-length interval
- Full-day intent
- Midnight crossing
- Effective range
- Priority
- DST policy
- Overlap explanation

## Programming Block

A Programming Block defines one scheduling segment and intent.

## Programming Block Fields

```text
programmingBlockId
name
eligibleDaypartIds
explicitTimeWindows
durationPolicy
boundaryPolicy
selectorReferences
ruleSetReferences
placementPolicy
repeatPolicyOverride
presentationPolicy
priority
enabledState
```

## Programming Block Examples

- Horror Movie Night
- Weekday Sitcom Strip
- Saturday Cartoons
- Franchise Marathon
- Seasonal Showcase
- Short-Form Filler
- Late-Night Cult Films
- Sunday Family Movies
- Overnight Rotation

## Block Boundary Policy

Possible values:

- Exact start
- Exact end
- Fill to boundary
- Allow overrun
- No overrun
- Trim filler
- Insert slate
- Leave explicit off-air
- Continue current program

## Block Duration Policy

A block may be:

- Fixed duration
- Boundary-defined
- Until next block
- All day
- One item
- Item-count target
- Dynamic bounded duration

## Catalog Selector

A Catalog Selector identifies eligible Catalog Items.

## Selector Fields

Potential criteria:

- Media kind
- Genre
- Tag
- Label
- Series
- Franchise
- Release year
- Duration range
- Content rating
- Availability
- Language
- Collection
- Explicit include IDs
- Explicit exclude IDs
- Source policy
- Metadata completeness
- Seasonal label

## Selector Rule

Selectors use normalized Catalog fields.

They do not query Plex, Jellyfin, or Emby directly.

## Selector Stability

Selector evaluation against one Catalog Snapshot must be deterministic.

## Explicit Include

Explicit include uses Catalog Item IDs.

## Explicit Exclude

Explicit exclusion is a hard constraint only within the selector or rule scope
where configured.

## Seasonal Selector

A seasonal selector may identify holiday or event titles.

Membership does not make the title season-only.

## Rule Set

A Rule Set groups rules for reuse and precedence.

## Rule Set Fields

```text
ruleSetId
name
scope
priority
evaluationMode
rules
enabledState
```

## Rule Set Scopes

- Network
- Channel
- Daypart
- Block
- Selector
- Schedule horizon

## Programming Rule

A Programming Rule describes one constraint, preference, or placement behavior.

## Rule Fields

```text
ruleId
ruleType
classification
parameters
priority
weight
enabledState
explanationTemplate
algorithmVersionRequirement
```

## Rule Classifications

- Hard constraint
- Soft constraint
- Placement rule
- Spacing rule
- Sequence rule
- Quota rule
- Timing rule
- Presentation rule

## Hard Constraint

Failure makes a candidate ineligible.

Examples:

- Maximum content rating
- Required availability
- Allowed media kind
- Must fit unbreakable window
- Minimum exclusion interval
- Explicit season-only window

## Soft Constraint

A soft constraint contributes score.

Examples:

- Prefer items not aired recently
- Prefer target genre balance
- Prefer chronological progression
- Prefer seasonal title during its season
- Prefer unused promotional assets
- Prefer target duration distribution

## Seasonal Preference

The default seasonal behavior is a soft preference or block-level priority
increase.

It does not remove seasonal titles from the ordinary rotation outside the
season.

## Placement Rule

Controls occupation of time.

Examples:

- Start at boundary
- Fill to boundary
- Allow overrun
- Preserve episode order
- Insert bumper
- Alternate media kind
- Movie followed by shorts
- Keep franchise installments in order

## Spacing Rule

Controls repeat distance.

Examples:

- Minimum title repeat interval
- Minimum episode repeat interval
- Franchise spacing
- Seasonal repeat tolerance
- Bumper cooldown
- Ident cooldown

## Sequence Rule

Examples:

- Episode order
- Release order
- Custom order
- Shuffle with seed
- Marathon sequence
- Alternating series

## Quota Rule

Examples:

- Movie count
- Episode count
- Genre ratio
- Series share
- Filler ceiling
- Seasonal content target
- Original label target

## Timing Rule

Examples:

- Start at local time
- End before boundary
- No overnight start
- Holiday effective range
- Prime-time minimum duration
- Daypart-specific rating

## Presentation Rule

Examples:

- Bumper before program
- Ident at hour boundary
- Rating card before restricted item
- Seasonal ident during date range
- Technical slate on missing content

## Rule Precedence

Precedence must be deterministic.

Suggested order:

1. Safety hard constraints
2. Explicit operator exclusions
3. Channel hard overrides
4. Network hard constraints
5. Block hard constraints
6. Sequence requirements
7. Placement rules
8. Quotas
9. Soft preferences
10. Stable tie-break

The exact scheduling evaluation belongs to Milestone 07.

## Rule Explanation

Every activated rule must provide a human-readable explanation template.

## Repetition Policy

Global repetition policy may include:

- Title repeat interval
- Episode repeat interval
- Series repeat interval
- Franchise repeat interval
- Same-day repeat policy
- Same-week repeat policy
- Recently aired window
- Exception policy
- Seasonal repeat adjustment

## Seasonal Repeat Adjustment

During a configured season, repeat tolerance may be relaxed for seasonal titles.

Outside the season, ordinary repeat policy applies.

The title remains eligible unless explicitly excluded.

## Timing Policy

Global timing policy may include:

- Default block alignment
- Hour boundaries
- Half-hour boundaries
- Overrun
- Underrun
- Filler insertion
- Slate insertion
- Off-air policy
- DST handling

## Filler Policy

Filler policy defines:

- Eligible filler selector
- Maximum filler duration
- Minimum filler duration
- Repeat interval
- Trimming allowance
- Bumper use
- Slate fallback
- Gap tolerance
- Priority

## Randomization Policy

Randomization policy defines:

- Algorithm version
- Seed source
- Tie-break behavior
- Shuffle scope
- Stability requirements
- Reproducibility

## Randomization Rule

Activated configuration stores randomization policy.

Generated Schedule Plan stores actual seed and algorithm version.

## Effective Range

A Programming Revision may have an effective time range.

## Effective Range Semantics

An effective range controls revision selection.

It does not mutate the revision.

## Future Revision

A future revision may be scheduled for activation.

## Revision Selection

At schedule-generation time, selection must be explicit.

The plan records selected revision ID.

## Configuration Snapshot

Scheduling receives an immutable configuration snapshot.

## Configuration Snapshot Contents

- Network ID
- Channel ID
- Network Profile Revision
- Channel Profile Revision
- Branding Revision
- Programming Revision
- Channel overlay
- Effective time zone
- Output policy references
- Content hashes
- Catalog Snapshot ID

## Configuration Fingerprint

A deterministic fingerprint supports:

- Plan reproducibility
- Stale detection
- Approval
- Audit
- Comparison

## Stale Draft Plan

A draft plan may become stale when:

- Active profile changes
- Programming revision changes
- Channel overlay changes
- Catalog revision changes
- Time zone changes
- Output compatibility changes
- Branding asset becomes invalid

Approved plans are not mutated.

## Ownership Rules

## Network-Owned Configuration

Network owns:

- Editorial mission
- Audience Profile
- Editorial Profile
- Primary time zone
- Base Programming Configuration
- Default Branding
- Default Catalog policy
- Default guide-description policy
- Default content-rating policy

## Channel-Owned Configuration

Channel owns:

- Channel number
- Output Identity
- Output configuration reference
- Time-zone override
- Time shift
- Channel Profile
- Branding override
- Programming overlay
- Active publication reference
- Channel lifecycle

## Instance-Owned Defaults

Instance may provide:

- Default time zone during creation
- Default schedule horizon
- Default output settings
- Default locale
- Default guide policy
- Default channel number suggestion

Defaults are copied or referenced according to policy.

Instance defaults do not retroactively mutate active revisions.

## Catalog-Owned Inputs

Catalog owns:

- Catalog Item identity
- Metadata
- Availability
- Collections
- Labels
- Playback Variants
- Catalog Snapshots

Network and Channel rules reference Catalog IDs and normalized fields.

## Publication-Owned State

Publication owns active approved-plan selection.

Channel stores a reference according to aggregate design.

## Playout-Owned State

Playout owns active sessions.

Channel lifecycle commands may request Playout action through application
services.

## Override Ownership

Every override identifies:

- Base owner
- Base revision
- Override owner
- Override revision
- Field or rule
- Effective range
- Actor
- Audit
- Removal behavior

## Override Prohibitions

An override must not:

- Modify base revision
- Hide its source
- Use provider IDs as Catalog identity
- Silently disable safety rules
- Change approved plan
- Alter another Channel
- Become a mutable unversioned settings blob

## Network Creation Workflow

1. Create Network ID.
2. Validate slug.
3. Select time zone.
4. Create draft Network Profile Revision.
5. Create draft Programming Configuration Revision.
6. Optionally create draft Branding Profile Revision.
7. Create or attach first Channel.
8. Validate.
9. Activate revisions.
10. Activate Network.
11. Record audit.

## Channel Creation Workflow

1. Select Network.
2. Create Channel ID.
3. Assign provisional Channel number.
4. Create draft Channel Profile Revision.
5. Derive Output Identity.
6. Select output configuration.
7. Choose inherited or override time zone.
8. Add optional branding override.
9. Add optional programming overlay.
10. Validate.
11. Activate Channel Profile Revision.
12. Activate Channel.
13. Record audit.

## Clone Network Workflow

Cloning may copy:

- Network Profile
- Programming Configuration
- Branding
- Channel definitions
- Output references
- Template lineage

Cloning generates new entity IDs and revision IDs.

It does not copy active Schedule Plans as active output.

## Clone Channel Workflow

Cloning generates:

- New Channel ID
- New number
- New Output Identity
- New profile revision
- New override revisions

It may reference the same Network base configuration.

## Template Application

A Template may create:

- Network
- Network Profile Revision
- Programming Configuration Revision
- Branding Profile Revision
- Channel definitions
- Asset assignments

## Template Independence

After application, the Network operates from ChannelForge-owned revisions.

Later Template changes do not mutate it.

## Legacy Migration

Legacy Tunarr Channels migrate into Network and Channel entities.

## Legacy Migration Goals

Preserve:

- Channel number
- Channel name
- Time zone
- Guide identity
- Icon or logo
- Enabled state
- Output profile
- Schedule source
- Runtime settings
- Existing guide behavior
- Existing stream compatibility
- Existing user order
- Provider references through Catalog mapping

## Legacy Network Assignment

Because inherited Tunarr Channels may not have a first-class Network, migration
must assign them deliberately.

## Network Assignment Strategies

Supported strategies:

- One default migrated Network
- Group by legacy metadata
- One Network per legacy grouping
- Operator-selected grouping
- One Network per Channel for strict isolation

## Default Migrated Network

A default migrated Network should have:

- Stable generated Network ID
- Clear name
- Migration provenance
- Draft Network Profile Revision
- Draft Programming Configuration Revision
- Operator-editable branding
- Explicit time zone
- Legacy migration reference

## Default Network Naming

Suggested starting name:

```text
Migrated Network
```

The UI should encourage operator editing.

## Channel Migration Mapping

Each legacy Channel maps to one ChannelForge Channel ID.

## Channel Mapping Fields

- Legacy namespace
- Legacy Channel ID
- ChannelForge Channel ID
- Network ID
- Mapping state
- Number
- Guide ID
- Source schema version
- Migration run
- Verification
- Conflict

## Legacy Number Preservation

Preserve the existing Channel number when valid and conflict-free.

## Automatic Renumbering Prohibition

Do not automatically renumber without explicit migration policy.

## Legacy Name Preservation

Preserve:

- Display name
- Short name where available
- Call sign where available
- Guide name
- Existing icon label

## Legacy Time Zone

When explicit legacy time zone exists:

- Validate IANA value
- Preserve it
- Record provenance
- Create conflict when invalid

## Missing Legacy Time Zone

When no explicit time zone exists:

1. Use Instance default.
2. Record inferred provenance.
3. Flag review where schedule semantics may change.
4. Do not pretend the value came from legacy data.

## Legacy Guide Identity

Preserve guide ID where client compatibility requires it.

Map it to canonical Channel ID.

## Legacy Logo

Legacy logo may become:

- Presentation Asset
- Remote reference
- Managed imported asset
- Conflict
- Missing warning

## Legacy Enabled State

Map to:

- Active
- Paused
- Draft
- Archived

The mapping policy must be explicit.

## Legacy Output Profile

Translate to an output configuration reference.

Unsupported settings become:

- Warning
- Preserved migration metadata
- Conflict
- Deferred runtime mapping

## Legacy Schedule Configuration

Inherited scheduling configuration becomes a Programming Configuration
Revision.

## Migration Revision Status

A migrated Programming Configuration Revision may be:

- Draft requiring review
- Active after verified automatic migration
- Invalid
- Conflict

## Automatic Activation

Automatic activation is allowed only when:

- Translation is complete
- Semantics are verified
- No conflict exists
- Policy permits
- Validation passes
- Operator policy has accepted automatic activation

## Default Migration Behavior

Default behavior should favor:

```text
DRAFT requiring operator review
```

when schedule semantics could change.

## Legacy Seasonal Behavior

Legacy seasonal lists or scheduling rules should migrate without removing
titles from ordinary rotations unless the original configuration explicitly
encoded season-only exclusion.

## Legacy Schedule Source

Preserve source references through:

- Catalog Item mapping
- Collection mapping
- Explicit include list
- Explicit exclude list
- Conflict
- Placeholder

## Legacy Runtime Settings

Runtime settings remain compatibility configuration until Milestone 08.

## Legacy Channel Conflict Types

- Duplicate number
- Invalid number
- Missing name
- Invalid time zone
- Duplicate guide ID
- Missing logo
- Unsupported output profile
- Unresolved program IDs
- Invalid schedule rule
- Provider-specific rule
- Missing Catalog mapping
- Conflicting Network grouping

## Migration Conflict Resolution

Possible actions:

- Change number
- Change guide ID
- Choose Network
- Choose time zone
- Accept inferred time zone
- Select output profile
- Remove unsupported rule
- Convert rule
- Keep draft
- Exclude Channel
- Archive Channel
- Defer

## Migration Verification

Verify:

- Legacy Channel exists
- Network exists
- Channel exists
- Mapping unique
- Number preserved or approved change
- Name preserved
- Time zone preserved or provenance recorded
- Guide ID preserved or approved change
- Logo mapped
- Enabled state mapped
- Output profile mapped
- Schedule configuration mapped
- Catalog references resolve
- Active status validates

## Compatibility Read

Before cutover:

1. Read canonical Network and Channel when present.
2. Resolve legacy mapping.
3. Fall back to legacy Channel.
4. Translate to ChannelForge read model.
5. Record fallback.
6. Avoid duplicate entity creation.

## Compatibility Write

Temporary write translation may be required when legacy runtime still consumes
Channel rows.

## Write Authority

Per migration phase, authority must be explicit.

## Legacy Write Freeze

Before final Channel cutover:

- Legacy Channel create route is frozen
- Legacy Channel update route is frozen
- Legacy Channel delete or archive route is frozen
- Legacy scheduling writer is frozen
- Legacy Channel background writer is frozen
- First-party UI uses canonical commands
- Server-side enforcement exists
- Rollback exists

## Persistence Foundations

Milestone 06 may introduce tables or equivalent repositories for:

- Network
- Network Profile Revision
- Channel
- Channel Profile Revision
- Output Identity
- Branding Profile
- Branding Profile Revision
- Presentation Asset
- Asset Assignment
- Programming Configuration
- Programming Configuration Revision
- Daypart
- Programming Block
- Rule Set
- Rule
- Catalog Selector
- Channel Programming Overlay
- Migration mapping extensions

## Schema Ownership

Networks owns Network tables.

Channels owns Channel and Output Identity tables.

Branding owns Branding and Presentation Asset tables.

Programming owns Programming Configuration tables.

## Revision Storage

Revisions may store:

- Normalized relational children
- Canonical JSON document
- Hybrid relational and JSON

The chosen representation must preserve:

- Immutability
- Validation
- Canonical hashing
- Query needs
- Migration
- Human diagnostics

## Canonical Hash

Every activated revision has deterministic content hash.

## Foreign Keys

Required relationships include:

- Channel to Network
- Profile Revision to owner
- Programming Revision to Network
- Channel overlay to Channel and base revision
- Branding Revision to owner
- Asset Assignment to asset and owner
- Active revision references
- Publication reference to Channel

## Archive Constraints

Archiving does not cascade-delete historical revisions.

## Optimistic Concurrency

Mutable aggregate roots use expected version.

Revision creation uses expected active revision where appropriate.

## API Foundations

## Network Commands

- Create Network
- Update slug
- Create profile draft
- Validate profile draft
- Activate profile revision
- Create programming draft
- Validate programming draft
- Activate programming revision
- Create branding draft
- Activate branding revision
- Pause Network
- Resume Network
- Archive Network
- Restore Network
- Apply Template
- Clone Network

## Network Queries

- List Networks
- Get Network
- Get effective Network profile
- Get revision history
- Get active programming revision
- Compare revisions
- Get Channels
- Get migration provenance
- Get validation
- Preview effective configuration

## Channel Commands

- Create Channel
- Change number
- Create Channel profile draft
- Activate Channel profile
- Set time-zone override
- Remove time-zone override
- Configure time shift
- Set output configuration
- Create branding override
- Create programming overlay
- Activate Channel
- Pause Channel
- Enter maintenance
- Resume Channel
- Archive Channel
- Restore Channel
- Clone Channel

## Channel Queries

- List Channels
- Get Channel
- Resolve by canonical ID
- Resolve by number
- Get Output Identity
- Get effective profile
- Get effective programming configuration
- Get effective branding
- Get revision history
- Get migration mapping
- Get validation

## Revision API Rules

- Drafts are mutable with ETag
- Activated revisions are immutable
- Activation is a command
- Expected active revision is required
- Validation result is explicit
- Content hash is returned
- Historical revisions remain readable
- Secrets are absent
- Provider IDs are absent from canonical rules

## Channel Number API

The API should accept structured value:

```json
{
  "major": 7,
  "minor": 1
}
```

Canonical display is server-generated.

## Time-Zone API

Use IANA strings.

## Effective Configuration API

Effective configuration response should include:

- Base revision IDs
- Override revision IDs
- Effective values
- Provenance
- Validation warnings
- Fingerprint

## Long-Running Work

Bulk migration, bulk clone, or validation may return Background Job.

## UI Foundations

Initial Network UI:

- Network list
- Create Network
- Network overview
- Profile editor
- Editorial Profile editor
- Audience Profile editor
- Programming editor
- Branding editor
- Revision history
- Validation
- Activation
- Pause
- Archive
- Migration status

Initial Channel UI:

- Channel list
- Channel detail
- Number editor
- Profile editor
- Output Identity preview
- Time-zone inheritance
- Time shift
- Output configuration
- Branding override
- Programming overlay
- Revision history
- Activation
- Pause
- Maintenance
- Archive
- Migration conflict

## Network Builder Workflow

A guided Network builder should separate:

1. Identity
2. Audience
3. Editorial direction
4. Time zone
5. Channels
6. Dayparts
7. Blocks
8. Rules
9. Branding
10. Review and activate

## Channel Builder Workflow

A guided Channel builder should separate:

1. Network
2. Number
3. Display identity
4. Time zone
5. Output policy
6. Overrides
7. Review and activate

## Programming Editor

The editor should visually distinguish:

- Hard constraints
- Soft preferences
- Placement rules
- Spacing rules
- Sequence rules
- Quotas
- Timing rules
- Presentation rules

## Seasonal Programming UI

The UI must distinguish:

- Seasonal boost
- Seasonal block
- Season-only hard constraint
- Seasonal branding
- Seasonal repeat adjustment

The default should not imply that seasonal titles disappear outside the season.

## Revision Diff

Revision comparison should show:

- Added fields
- Removed fields
- Changed fields
- Rule changes
- Selector changes
- Time-zone changes
- Branding changes
- Channel override changes
- Effective behavior warning

## Activation Preview

Before activation, show:

- Validation
- Affected Channels
- Affected draft plans
- Catalog selector counts
- Number conflicts
- Time-zone changes
- Seasonal behavior
- Branding asset status
- Output identity impact
- Migration implications

## Audit

Audit actions include:

- Network create
- Network profile activate
- Programming revision activate
- Branding revision activate
- Network pause
- Network archive
- Channel create
- Channel renumber
- Channel profile activate
- Time-zone override
- Output identity change
- Channel pause
- Maintenance
- Channel archive
- Override activate
- Migration resolution

## Audit Metadata

- Actor
- Resource
- Prior revision
- New revision
- Expected version
- Reason
- Correlation ID
- Timestamp
- Migration run
- Affected Channels
- Affected draft plans

## Observability

## Network Metrics

- Network count by status
- Active Channels per Network
- Draft revision count
- Invalid revision count
- Profile activation count
- Programming activation count
- Branding activation count
- Archive count
- Restore count

## Channel Metrics

- Channel count by status
- Number conflicts
- Output Identity changes
- Time-zone overrides
- Time-shifted Channels
- Pause count
- Maintenance count
- Archive count
- Legacy fallback count

## Programming Metrics

- Daypart count
- Block count
- Rule count
- Hard versus soft rules
- Invalid rule count
- Selector result count
- Seasonal rule count
- Overlay count
- Stale overlay count
- Validation duration

## Structured Logs

Fields:

- `module`
- `networkId`
- `channelId`
- `networkProfileRevisionId`
- `channelProfileRevisionId`
- `programmingConfigurationRevisionId`
- `brandingProfileRevisionId`
- `operation`
- `actorId`
- `correlationId`
- `durationMs`
- `result`

## Log Prohibitions

Do not log:

- Secret material
- Full private provider path
- Raw provider payload
- Sensitive authentication data
- Arbitrary user notes without policy
- Unbounded revision document

## Validation

## Network Validation

Checks:

- ID
- Slug
- Profile
- Time zone
- Active Channel
- Programming revision
- Branding revision
- Catalog policy
- Lifecycle
- Version
- Migration conflict

## Channel Validation

Checks:

- Network
- Number
- Number uniqueness
- Profile
- Output Identity
- Guide ID
- Time zone
- Output configuration
- Override compatibility
- Publication reference
- Lifecycle

## Programming Validation

Checks:

- Owner
- Revision status
- Effective range
- Dayparts
- Overlaps
- Blocks
- Selectors
- Rules
- Precedence
- Explanations
- Catalog fields
- Seasonal semantics
- Repeat policy
- Timing policy
- Filler policy
- Randomization policy
- Overlay base

## Branding Validation

Checks:

- Owner
- Asset
- MIME
- Dimensions
- Duration
- Checksum
- Placement
- Effective date
- Daypart
- Historical references

## Validation Severity

- `INFO`
- `WARNING`
- `ERROR`
- `BLOCKING`

## Activation Gate

Only blocking-free revisions may activate.

Warnings may require acknowledgement according to policy.

## Testing Strategy

Milestone 06 requires:

- Network domain tests
- Channel domain tests
- Revision tests
- Programming tests
- Branding tests
- Migration tests
- Repository contract tests
- API contract tests
- UI tests
- Time-zone tests
- DST tests
- Compatibility tests
- Security tests
- Performance tests
- Windows tests
- Linux tests

## Network Domain Tests

Test:

- Create
- Slug uniqueness
- Draft
- Activation
- Pause
- Resume
- Archive
- Restore
- Missing Channel
- Invalid time zone
- Revision activation
- Stale version
- Template lineage
- Historical preservation

## Channel Domain Tests

Test:

- Create
- Number parse
- Number uniqueness
- Number change
- Profile revision
- Activation
- Pause
- Maintenance
- Archive
- Restore
- Network ownership
- Output Identity
- Time-zone inheritance
- Time-zone override
- Time shift
- Override
- Historical preservation

## Network Profile Tests

Test:

- Draft edit
- Activation
- Immutability
- Clone
- Hash
- Audience Profile
- Editorial Profile
- Seasonal defaults
- Supersede

## Channel Profile Tests

Test:

- Inheritance
- Override
- Override removal
- Activation
- Immutability
- Output-facing name
- Logo override
- Hash

## Programming Revision Tests

Test:

- Draft
- Activation
- Immutability
- Effective range
- Clone
- Hash
- Base and overlay
- Stale overlay
- Invalid rule
- Selector
- Repeat policy
- Timing policy
- Randomization policy

## Daypart Tests

Test:

- Weekdays
- Weekend
- Overnight
- Full day
- Zero length
- Overlap
- Priority
- Date range
- Time-zone inheritance
- DST gap
- DST fold

## Programming Block Tests

Test:

- Boundary
- Duration
- Selector
- Rule Set
- Repeat override
- Presentation policy
- Priority
- Disabled state

## Rule Tests

Test:

- Hard constraint
- Soft preference
- Placement
- Spacing
- Sequence
- Quota
- Timing
- Presentation
- Explanation
- Stable precedence

## Seasonal Tests

Test:

- Seasonal boost inside range
- Seasonal boost outside range
- Seasonal title remains ordinarily eligible outside range
- Season-only hard constraint
- Seasonal block
- Seasonal branding
- Repeat adjustment
- Overlapping seasonal rules
- Time-zone boundary
- Year transition

## Branding Tests

Test:

- Revision
- Asset validation
- Network default
- Channel override
- Seasonal assignment
- Archived asset
- Historical reference
- Invalid duration
- Invalid image

## Output Identity Tests

Test:

- Canonical Channel ID
- Guide ID
- Tuner ID
- Display number
- Number change
- Guide ID conflict
- Cross-output consistency
- Archived Channel
- Restore

## Time-Zone Tests

Test:

- Valid IANA
- Invalid zone
- Network inheritance
- Channel override
- Instance inference during migration
- DST gap
- DST fold
- Seasonal range
- Time shift
- UTC persistence

## Migration Tests

Test:

- One default Network
- Grouped Networks
- One Network per Channel
- Number preservation
- Duplicate number
- Name preservation
- Missing time zone
- Invalid time zone
- Guide ID preservation
- Logo migration
- Enabled-state migration
- Output-profile migration
- Schedule-config migration
- Draft review default
- Automatic activation when verified
- Catalog mapping
- Rollback

## Compatibility Tests

Test:

- Canonical read
- Legacy fallback
- Mapping
- Legacy write translation
- Write freeze
- Route usage
- Legacy guide ID
- Legacy number
- No duplicate Channel

## API Contract Tests

Test:

- Authentication
- Authorization
- Create
- Invalid number
- Invalid time zone
- Slug conflict
- Number conflict
- ETag
- Stale ETag
- Revision activation
- Immutable revision
- Archive
- Restore
- Structured error
- Secret omission

## UI Tests

Test:

- Network builder
- Channel builder
- Profile editor
- Programming editor
- Revision diff
- Activation preview
- Seasonal distinction
- Migration conflict
- No double submit
- Accessibility
- Error display

## Security Tests

Test:

- Unauthorized activation
- Unauthorized archive
- Cross-Network Channel access
- Malformed ID
- Oversized revision
- HTML in descriptive fields
- Asset path exposure
- Provider ID injection
- Audit
- CSRF according to API policy

## Performance Tests

Measure:

- Network list
- Channel list
- Revision load
- Effective configuration calculation
- Revision diff
- Selector validation
- Large rule set
- Many Channels
- Migration
- Activation transaction

## Performance Planning Cases

- 10 Networks
- 100 Channels
- 1,000 rules across instance
- 10,000 Selector references
- 100 revision history entries per Network

These are planning cases.

Supported limits require measurement.

## Windows Tests

Focus:

- Time-zone database availability
- Asset paths
- Revision files if used
- Line endings
- Legacy path mapping
- SQLite locking

## Linux Tests

Focus:

- IANA time-zone data
- Container locale
- Asset storage
- Permissions
- SQLite WAL
- Migration restart

## Docker Validation

Test:

- Create Network
- Create Channel
- Restart
- Preserve identity
- Preserve revisions
- Preserve assets
- Time zone
- Migration
- API
- UI

## Unraid Validation

Validate:

- `/config` persistence
- Local time-zone selection
- PUID and PGID
- Asset storage
- Migration from inherited container data
- Restart
- Channel numbering
- Guide identity preservation

## Documentation Deliverables

Milestone 06 implementation should create:

```text
docs/implementation/networks-channels/
├── README.md
├── network-model.md
├── network-profile-revisions.md
├── editorial-profile.md
├── audience-profile.md
├── channel-model.md
├── channel-numbering.md
├── output-identity.md
├── time-zones-and-shifts.md
├── branding-revisions.md
├── presentation-assets.md
├── programming-configuration.md
├── dayparts.md
├── programming-blocks.md
├── programming-rules.md
├── seasonal-programming.md
├── override-policy.md
├── revision-activation.md
├── legacy-channel-migration.md
├── decision-register.md
└── completion-report.md
```

## Recommended Pull-Request Sequence

## PR 06A: Network Aggregate

Scope:

- Network ID
- lifecycle
- slug
- time zone
- repository
- tests

No Programming implementation.

## PR 06B: Network Profile Revisions

Scope:

- Revision aggregate
- Editorial Profile
- Audience Profile
- activation
- hash
- history
- tests

## PR 06C: Channel Aggregate

Scope:

- Channel ID
- Network ownership
- lifecycle
- repository
- tests

## PR 06D: Channel Number

Scope:

- Value object
- parsing
- canonical display
- uniqueness
- migration conflict
- tests

## PR 06E: Channel Profile Revisions

Scope:

- Profile
- inheritance
- override
- activation
- hash
- tests

## PR 06F: Output Identity

Scope:

- Canonical identity
- Guide ID
- Tuner ID
- cross-output contract
- compatibility mapping
- tests

## PR 06G: Time Zones and Time Shift

Scope:

- Network time zone
- Channel override
- migration provenance
- time-shift configuration
- DST validation
- tests

## PR 06H: Branding Profile Revisions

Scope:

- Branding aggregate
- revision
- Network default
- Channel override
- activation
- tests

## PR 06I: Presentation Assets

Scope:

- Asset model
- validation
- assignment
- seasonal assignment
- managed storage
- tests

## PR 06J: Programming Configuration Aggregate

Scope:

- Configuration identity
- revisions
- activation
- hash
- repository
- tests

## PR 06K: Dayparts

Scope:

- Local-time model
- overlap
- priority
- overnight
- DST
- tests

## PR 06L: Programming Blocks

Scope:

- Block model
- boundaries
- selectors
- Rule Set references
- tests

## PR 06M: Catalog Selectors

Scope:

- Normalized Catalog criteria
- explicit include/exclude
- deterministic evaluation contract
- tests

## PR 06N: Programming Rules

Scope:

- Classifications
- priority
- weight
- explanation
- validation
- no scheduling algorithm

## PR 06O: Repetition, Timing, Filler, and Randomization Policies

Scope:

- Policy models
- validation
- revision serialization
- tests

## PR 06P: Seasonal Programming

Scope:

- Seasonal boost
- seasonal block
- season-only hard rule
- repeat adjustment
- year-round eligibility invariant
- tests

## PR 06Q: Channel Programming Overlay

Scope:

- Base revision
- overlay
- merge semantics
- staleness
- validation
- tests

## PR 06R: Revision Activation and Fingerprints

Scope:

- Atomic activation
- optimistic concurrency
- content hash
- effective configuration fingerprint
- stale-plan signal

## PR 06S: Legacy Network Assignment

Scope:

- Default Network
- grouping policies
- migration provenance
- operator review
- tests

## PR 06T: Legacy Channel Migration

Scope:

- Channel mapping
- number
- name
- time zone
- guide ID
- logo
- state
- output settings
- tests

## PR 06U: Legacy Programming Migration

Scope:

- Schedule configuration translation
- draft review default
- seasonal semantics
- Catalog mappings
- conflicts
- tests

## PR 06V: Compatibility and Freeze Preparation

Scope:

- Canonical reads
- fallback
- temporary writes
- route metrics
- freeze guards
- no broad cutover

## PR 06W: API Foundations

Scope:

- Network commands
- Channel commands
- revision commands
- schemas
- ETags
- errors

## PR 06X: Initial UI Workflows

Scope:

- Network builder
- Channel builder
- revision editor
- activation preview
- migration conflicts
- feature flags

## PR 06Y: Completion Report

Scope:

- Model evidence
- revision evidence
- migration evidence
- platform results
- remaining risks

## Pull-Request Requirements

Every Milestone 06 PR must state:

- Owning module
- Aggregate
- Revision impact
- Schema impact
- API impact
- Compatibility mode
- Migration impact
- Time-zone impact
- Output identity impact
- Schedule-input impact
- Historical impact
- Tests
- Rollback

## Pull-Request Prohibitions

Do not combine:

- Network model and scheduler implementation
- Channel number and output protocol redesign
- Profile revision and package rebranding
- Programming configuration and FFmpeg changes
- Branding domain and broad UI theme redesign
- Seasonal policy and Catalog deletion logic
- Legacy migration and legacy table deletion
- Time-zone model and unrelated dependency update
- Output Identity and HDHomeRun device-identity change
- Revision activation and publication cutover

## Entry Gates

Milestone 06 may begin when:

1. Baseline inventory exists.
2. Module boundaries exist.
3. Identifier policy exists.
4. Persistence migration runner exists.
5. Transaction coordinator exists.
6. Compatibility framework exists.
7. Media Sources exist.
8. Catalog Items exist.
9. Catalog selectors can target normalized fields.
10. Catalog Snapshot contract exists.
11. Legacy Channel inventory exists.
12. Legacy scheduling configuration inventory exists.
13. Build passes.
14. Linux persistence and Catalog tests pass.
15. Windows issues are classified.
16. No critical mapping conflict blocks Network or Channel identity.

## Interstitial Programming and External Video Feeds Amendment

### Purpose

Milestone 06 owns Network and Channel policy for interstitial presentation and
external publisher assignment.

### Interstitial Pools

Implement:

- Interstitial Pool identity
- Network-scoped Pools
- Channel-scoped Pools
- Allowed Presentation Asset kinds
- Required and excluded tags
- Selection policy reference
- Repeat policy
- Duration policy
- Rights policy
- Active and archived lifecycle
- Immutable revision references where required

### Break Rules

Break Rules are part of Programming Configuration revisions.

Implement rules for:

- Before-program placement
- After-program placement
- Between-episode placement
- Programming Block boundaries
- Daypart boundaries
- Exact local-time boundaries
- Reserved Break Windows
- Bounded gap fill
- Before and after fixed events

Break Rules define intent and constraints.

They do not execute source resolution or FFmpeg.

### External Feed Assignment

Implement explicit assignment of External Feeds to:

- Networks
- Channels
- Programming configurations
- Discovery workflows

One External Feed may contribute to multiple Channels only through explicit
assignment.

### Revision and Lifecycle Rules

- Approved Programming Configuration revisions are immutable.
- Pool references are versioned or snapshot-safe.
- Feed assignment changes do not rewrite approved Schedule Plans.
- Archive and restore preserve historical references.
- Migrated Channels receive explicit default behavior rather than implicit
  filler inheritance.

### Suggested Additional Pull Requests

#### PR 06: Interstitial Pool Aggregate

- Aggregate and repository
- Network and Channel scope
- Membership and tag policy
- Lifecycle and concurrency tests

#### PR 06: Break Rule Configuration

- Rule schemas
- Programming Configuration revision integration
- Validation
- Fixed-event and boundary constraints

#### PR 06: External Feed Assignment

- Network and Channel assignment
- Default policy
- Migration mapping
- Authorization foundation

### Milestone 06 Completion Additions

Milestone 06 cannot be marked Complete until:

1. Interstitial Pools are first-class Network or Channel concepts.
2. Break Rules belong to immutable Programming Configuration revisions.
3. Feed assignment is explicit.
4. Scope and ownership are enforced.
5. Pool and Break Rule validation exists.
6. Migrated filler behavior has an explicit mapping or conflict.
7. Playlist terminology is not the primary model for this capability.

## Completion Gates

Milestone 06 is Complete when:

1. Network aggregate exists.
2. Network IDs are canonical.
3. Network lifecycle exists.
4. Active Network requires a Channel.
5. Network slug uniqueness is enforced.
6. Network time zone is explicit.
7. Network Profile Revision exists.
8. Editorial Profile exists.
9. Audience Profile exists.
10. Activated Network Profile is immutable.
11. Channel aggregate exists.
12. Channel IDs are canonical.
13. Channel belongs to one Network.
14. Channel lifecycle exists.
15. Channel Number value object exists.
16. Active number uniqueness is enforced.
17. Renumbering is audited.
18. Channel Profile Revision exists.
19. Activated Channel Profile is immutable.
20. Channel inheritance is reproducible.
21. Output Identity exists.
22. Guide ID maps to Channel ID.
23. Tuner ID maps to Channel ID.
24. Output adapters cannot invent identity.
25. Time-zone inheritance exists.
26. Time-zone override exists.
27. Missing migrated time zone records provenance.
28. Time-shift configuration exists.
29. DST policies are validated.
30. Branding Profile Revision exists.
31. Channel branding override exists.
32. Activated branding revision is immutable.
33. Presentation Asset exists.
34. Assets validate before activation.
35. Programming Configuration exists.
36. Programming Configuration Revision exists.
37. Activated Programming Revision is immutable.
38. Dayparts exist.
39. Overnight Dayparts work.
40. Daypart precedence is deterministic.
41. Programming Blocks exist.
42. Catalog Selectors use normalized fields.
43. Rule Sets exist.
44. Rule classifications exist.
45. Hard and soft rules are distinguishable.
46. Rule explanations exist.
47. Repetition policy exists.
48. Timing policy exists.
49. Filler policy exists.
50. Randomization policy exists.
51. Seasonal boost exists.
52. Seasonal block exists.
53. Season-only hard rule is explicit.
54. Seasonal titles remain ordinarily eligible year-round by default.
55. Channel programming overlay exists.
56. Overlay does not mutate base revision.
57. Effective configuration fingerprint exists.
58. Schedule input references exact revisions.
59. Legacy Network assignment works.
60. Default migrated Network is supported.
61. Legacy Channel number is preserved when valid.
62. Automatic renumbering is prohibited.
63. Legacy name is preserved.
64. Legacy time zone is preserved or inferred with provenance.
65. Legacy guide ID is preserved or mapped explicitly.
66. Legacy logo is migrated or reported.
67. Legacy enabled state is mapped.
68. Legacy output profile is mapped or conflicted.
69. Legacy schedule configuration becomes a revision.
70. Ambiguous migrated programming defaults to Draft.
71. Catalog references resolve through mappings.
72. Compatibility read works.
73. Legacy fallback is measured.
74. Write-freeze guards exist.
75. API commands exist.
76. Initial UI workflows exist.
77. Revision diff exists.
78. Activation preview exists.
79. Audit exists.
80. Windows tests pass or classified failures are tracked.
81. Linux tests pass.
82. Docker validation passes.
83. Unraid-relevant validation passes.
84. Performance baseline exists.
85. Completion report exists.
86. Milestone 07 entry is approved.

## Completion Evidence

The completion report should include:

- Network counts by status
- Channel counts by status
- Revision counts
- Active revision references
- Number uniqueness result
- Output Identity consistency result
- Time-zone result
- DST result
- Branding validation result
- Programming validation result
- Seasonal behavior result
- Overlay result
- Effective fingerprint result
- Legacy migration result
- Compatibility fallback result
- Windows result
- Linux result
- Docker result
- Unraid result
- Performance result
- Open conflicts
- Deferred risks

## Rollback

Milestone 06 remains additive until explicit cutover.

## Network Rollback

Rollback may:

- Disable canonical Network mode
- Restore compatibility reads
- Preserve Network IDs
- Preserve revisions
- Preserve mappings
- Stop canonical writes

## Channel Rollback

Rollback may:

- Restore legacy Channel read authority
- Preserve Channel IDs
- Preserve number mapping
- Preserve guide mapping
- Preserve canonical revisions
- Pause canonical commands

## Revision Rollback

Activated revisions are not edited backward.

Rollback activates a prior valid revision through a new activation record or
explicit pointer rollback according to policy.

## Renumber Rollback

Renumber rollback:

- Restores prior number if available
- Validates uniqueness
- Regenerates output identity
- Records audit
- Warns client impact

## Time-Zone Rollback

Restoring prior time zone may mark draft plans stale.

Approved plans remain unchanged.

## Programming Rollback

Activate prior Programming Configuration Revision.

Do not mutate current revision.

## Branding Rollback

Activate prior valid Branding Revision.

Preserve assets.

## Migration Rollback

- Restore legacy authority
- Preserve mapping
- Preserve migration findings
- Restore backup when required
- Do not regenerate IDs
- Reconcile temporary writes

## Failure Handling

## Network Activation Failure

- Keep Network Draft or prior state
- Preserve active revisions
- Return validation
- Do not partially activate

## Channel Activation Failure

- Preserve prior Channel state
- Do not publish output identity partially
- Return conflict
- Preserve number reservation according to transaction policy

## Revision Activation Failure

- Keep current active revision
- Keep draft
- Record failure
- Do not supersede active revision

## Number Conflict

- Reject activation or renumber command
- Return conflicting Channel reference where authorized
- Do not guess replacement

## Time-Zone Failure

- Reject invalid zone
- Preserve prior zone
- Return actionable error
- Do not persist bare offset as zone

## Asset Failure

- Keep prior Branding Revision
- Mark draft invalid
- Preserve asset diagnostics

## Programming Validation Failure

- Keep revision Draft or Invalid
- Return rule and path
- Do not activate partially

## Migration Conflict

- Preserve legacy Channel
- Preserve mapping proposal
- Keep canonical entity Draft where appropriate
- Require operator decision

## Risks

### Network/Channel Confusion

Implementation may treat each Channel as an isolated Network.

Mitigation:

- Explicit ownership
- Module separation
- Network-first UI
- Aggregate tests

### Revision Bypass

Mutable settings blobs may bypass immutable revisions.

Mitigation:

- Repository boundaries
- Activation commands
- Architecture tests
- Hashes

### Number Collision

Migration or restore may produce duplicate numbers.

Mitigation:

- Unique constraint
- Conflict queue
- No automatic renumber
- Activation gate

### Output Identity Drift

Guide, playlist, and tuner identity may diverge.

Mitigation:

- Canonical Output Identity
- Cross-output tests
- Shared ID mapping

### Time-Zone Drift

Instance defaults may silently change editorial meaning.

Mitigation:

- Explicit Network zone
- Migration provenance
- Revision snapshot
- DST tests

### Seasonal Exclusion Error

Seasonal labels may accidentally remove titles from ordinary rotation.

Mitigation:

- Default soft preference
- Explicit hard-rule classification
- UI distinction
- Invariant tests

### Override Complexity

Channel overlays may become opaque.

Mitigation:

- Sparse overrides
- Provenance
- Diff
- Fingerprint
- Staleness validation

### Legacy Schedule Semantic Drift

Migration may approximate inherited rules incorrectly.

Mitigation:

- Draft review default
- Characterization
- Conflict
- Comparison
- No automatic activation when ambiguous

### Branding Asset Loss

Replacing logos may break guide history.

Mitigation:

- Managed assets
- Checksums
- Retention
- Revision references

### Slug Coupling

External callers may treat slug as identity.

Mitigation:

- Canonical IDs
- Redirect or alias policy
- API contracts

### Time-Shift Ambiguity

Offset feeds may behave incorrectly at DST transitions.

Mitigation:

- Explicit policy
- UTC plan instants
- tests
- Separate output identity

### Oversized Revision Documents

Large rules may degrade validation.

Mitigation:

- Limits
- relational children
- canonical hashing
- performance tests

### Migration Grouping Error

Default Network assignment may not match user intent.

Mitigation:

- Preview
- operator grouping
- reversible mapping
- clear default Network

### UI Overload

Network-first concepts may feel more complex than Channels alone.

Mitigation:

- Guided builders
- defaults
- progressive disclosure
- templates

## Milestone Invariants

1. Network is the editorial identity.
2. Channel is the tuneable output identity.
3. Network and Channel are distinct.
4. A Channel belongs to one Network in version 1.
5. An active Network has at least one Channel.
6. Network IDs are ChannelForge-owned.
7. Channel IDs are ChannelForge-owned.
8. Slug is not identity.
9. Channel number is not identity.
10. Guide ID is not ChannelForge identity.
11. Provider IDs do not enter Network rules.
12. Provider IDs do not enter Channel identity.
13. Activated profile revisions are immutable.
14. Activated Programming Revisions are immutable.
15. Activated Branding Revisions are immutable.
16. Schedule Plans record exact revisions.
17. Approved plans are immutable.
18. Channel overrides do not mutate Network revisions.
19. Effective configuration is reproducible.
20. Channel number uniqueness is enforced.
21. Automatic migration renumbering is prohibited.
22. Output adapters use canonical Output Identity.
23. XMLTV identity maps to Channel ID.
24. M3U identity maps to Channel ID.
25. HDHomeRun identity maps to Channel ID.
26. Time zones use IANA identifiers.
27. Persisted instants use UTC.
28. Local dayparts retain time-zone context.
29. Missing legacy time zone records inferred provenance.
30. DST behavior is explicit.
31. Time-shifted Channels have distinct identity.
32. Time shift does not mutate source plan.
33. Branding assets validate before activation.
34. Historical branding references survive.
35. Catalog Selectors use normalized Catalog state.
36. Scheduling does not query providers live.
37. Hard and soft rules remain distinguishable.
38. Rule precedence is deterministic.
39. Daypart precedence is deterministic.
40. Randomized behavior records algorithm and seed.
41. Seasonal boost is not season-only exclusion.
42. Seasonal titles remain eligible year-round by default.
43. Season-only behavior requires explicit hard rule.
44. Legacy Channel numbers are preserved when valid.
45. Legacy Channel names are preserved.
46. Legacy guide identity is preserved or mapped.
47. Legacy schedule configuration becomes a revision.
48. Ambiguous migration defaults to Draft review.
49. Legacy tables are not deleted in this milestone.
50. Legacy fallback remains measurable.
51. Write authority remains explicit.
52. Frozen legacy writes are enforced server-side.
53. Network archival preserves Channels and history.
54. Channel archival preserves schedule and guide history.
55. Recommendations cannot silently change Network state.
56. Templates cannot silently mutate applied Networks.
57. UI does not submit duplicate mutations.
58. Audit captures revision transitions.
59. Build remains green.
60. Windows behavior is tested.
61. Linux behavior is authoritative for production.
62. Docker and Unraid remain supported.
63. Attribution remains intact.
64. Milestone 07 begins only after completion gates pass.

## Deferred Decisions

The following decisions remain deferred:

- Exact Network table layout
- Exact Channel table layout
- Exact revision storage strategy
- Exact slug redirect policy
- Exact Channel number upper limits
- Exact minor-number precision
- Exact output scope for number uniqueness
- Exact guide ID format
- Exact tuner lineup ID format
- Exact Output Identity revision storage
- Exact time-shift realization
- Exact DST gap policy
- Exact DST fold policy
- Exact seasonal calendar provider
- Exact holiday definitions
- Exact Audience Profile schema
- Exact Editorial Profile weights
- Exact rule parameter schemas
- Exact selector expression language
- Exact overlay merge implementation
- Exact revision diff library
- Exact asset transformation pipeline
- Exact branding preview
- Exact template library
- Exact default migrated Network name
- Exact grouping heuristic
- Exact automatic migration confidence threshold
- Exact output configuration schema
- Final legacy route removal
- Final legacy table deletion
- Final scheduling engine behavior
- Final publication behavior
- Final playout behavior

## Immediate Next Milestone

After this milestone is completed, proceed to:

```text
docs/implementation/07-deterministic-scheduling.md
```

That milestone will consume immutable Network, Channel, Branding, Programming
Configuration, and Catalog Snapshot inputs to generate reproducible Schedule
Plans with deterministic rule evaluation, evidence, validation, approval, and
staleness handling.
