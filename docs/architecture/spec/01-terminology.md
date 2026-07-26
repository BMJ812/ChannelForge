# ChannelForge Terminology

- **Specification version:** 0.1
- **Status:** Draft

This document defines the canonical meaning of core ChannelForge terms.

Terms inherited from Tunarr may continue to exist internally during migration,
but new ChannelForge APIs, database entities, documentation, and interface text
should use the terminology defined here.

## Product Terms

### ChannelForge

The application and project as a whole.

ChannelForge imports media, models television networks, generates schedules,
executes playout, publishes guide data, and exposes compatible live television
outputs.

### Network

A persistent editorial and programming identity.

A network defines what kind of television service the user intends to operate.
It may include:

- Name
- Description
- Audience profile
- Editorial profile
- Programming preferences
- Exclusions
- Dayparts
- Programming blocks
- Scheduling policies
- Branding
- Health targets
- One or more output channels

A network is not the same thing as a channel.

Example:

`Forge Horror` is a network identity.

### Channel

A numbered or otherwise addressable output feed belonging to a network.

A channel has operational properties such as:

- Channel number
- Stream identifier
- Guide identifier
- Output configuration
- Resolution or transcoding profile
- Time offset
- Active schedule
- Playout state

A network may initially have one channel but the model must permit multiple
channels later.

Examples include:

- Main feed
- East feed
- West feed
- Seasonal feed
- Alternate feed

### Network Identity

The editorial definition of a network.

It describes what the network is intended to feel like and what kinds of
programming belong on it. It is separate from operational stream configuration.

### Network Profile

The structured configuration containing a network's audience, genre, runtime,
era, mood, franchise, language, rating, and format preferences.

### Editorial Profile

The content-selection characteristics of a network.

Examples:

- Horror-focused
- Family-friendly
- Comedy-heavy
- Classic television
- Adult animation
- Educational preschool

### Audience Profile

The intended viewer classification of a network or programming block.

Audience classifications are normalized ChannelForge metadata and must not be
treated as identical to a source server's rating string.

## Programming Terms

### Programming

The editorial process of deciding what content should air, when it should air,
and why it belongs in that position.

Programming is distinct from playout.

### Programming Engine

The deterministic subsystem that evaluates network configuration, scheduling
rules, catalog eligibility, historical usage, and a random seed to generate a
schedule plan.

The Programming Engine does not directly run FFmpeg or serve a live stream.

### Programming Director

The explainable recommendation subsystem.

It evaluates a network and its schedules and produces rule-based observations
such as:

- The network repeats too frequently.
- The network is light on comedy.
- Primetime lacks flagship programming.
- The movie pool is too narrow.
- Existing library items match an underserved block.

The Programming Director advises. It does not silently alter the network.

### Rule

A deterministic statement evaluated by the Programming Engine.

Rules are classified as:

- Hard constraints
- Soft constraints
- Placement policies
- Validation rules
- Health rules

### Hard Constraint

A requirement that cannot be violated during schedule generation.

Examples:

- Excluded ratings cannot air.
- Unavailable media cannot be selected.
- A configured hard repeat window must be respected.
- A program must fit within a fixed block when overflow is prohibited.

### Soft Constraint

A preference that affects candidate scoring but may be traded against other
preferences.

Examples:

- Prefer comedy in the afternoon.
- Favor flagship programs during primetime.
- Increase seasonal content during October.
- Reduce overrepresented franchises.

### Placement Policy

A rule controlling how selected content is positioned.

Examples:

- Start movies at 8:00 PM.
- Keep episodes sequential.
- Alternate franchises.
- Align programs to the half hour.
- Insert a bumper between programs.

### Weight

A configurable numeric influence used when ranking eligible programming
candidates.

A weight does not override a hard constraint.

### Deterministic Randomization

Seeded random selection that produces the same output when all inputs, history,
configuration, and seed are unchanged.

### Random Seed

A recorded value used by deterministic randomization.

Every generated schedule plan must retain the seed used to create it.

## Time and Schedule Terms

### Schedule Plan

A versioned proposed or approved programming result produced by the Programming
Engine for a defined time range.

A schedule plan records:

- Network
- Channel
- Time range
- Input snapshot or revision references
- Random seed
- Rule evaluation results
- Scheduled entries
- Warnings
- Unfilled periods
- Generation timestamp
- Approval state

### Schedule Entry

A single planned item within a schedule plan.

A schedule entry references a catalog item or non-programming asset and defines
its intended start time, end time, and placement context.

### Lineup

The ordered sequence of schedule entries assigned to a channel.

During migration, inherited Tunarr code may use `lineup` as a lower-level
runtime representation. In ChannelForge documentation, a lineup is the ordered
result of an approved schedule plan, not the network itself.

### Daypart

A named recurring time range associated with programming expectations.

Examples:

- Morning
- Daytime
- Afternoon
- Primetime
- Late Night
- Overnight

Dayparts describe broad editorial periods and may contain one or more
programming blocks.

### Programming Block

A scheduling instruction for a bounded time range.

A block defines the type of programming intended for that period rather than a
manually selected episode list.

Examples:

- Preschool education
- Afternoon comedy
- Friday horror movies
- Saturday morning animation
- Late-night adult animation

### Fixed Block

A programming block with explicit start and end times.

### Flexible Block

A programming block that may shift within defined limits while satisfying its
duration and placement requirements.

### Schedule Horizon

The future time range ChannelForge attempts to keep programmed.

Example:

Maintain fourteen days of approved schedule coverage.

### Schedule Coverage

The percentage or duration of a requested time range containing valid scheduled
entries.

### Gap

A period in the schedule with no valid scheduled entry.

### Overflow

The condition where a selected program extends beyond the intended end of its
block or planning range.

### Repeat Window

The minimum elapsed time required before the same title, episode, movie,
franchise, or other configured identity may be scheduled again.

### Franchise Spacing

A rule controlling how closely content from the same franchise may appear.

### Schedule History

The retained record of previously approved or aired schedule entries used for
repeat protection, health analysis, and recommendations.

## Media Terms

### Catalog

ChannelForge's normalized internal representation of all known programming and
non-programming assets.

The catalog is independent of Plex, Jellyfin, Emby, or any other source system.

### Catalog Item

A ChannelForge-owned media entity available for programming evaluation.

Examples:

- Movie
- Episode
- Short
- Trailer
- Bumper
- Station identification
- Filler segment

### Title

The conceptual work represented by one or more catalog items.

Depending on type, a title may represent a movie, series, season, episode, or
other editorial identity.

### Media Source

An external system from which ChannelForge imports metadata and resolves
playback.

Initial media sources include:

- Plex
- Jellyfin
- Emby

### Source Binding

The relationship between a ChannelForge catalog item and the corresponding item
inside a media source.

A catalog item may have more than one source binding.

### Playback Variant

A playable representation of a catalog item.

Examples:

- Plex file
- Jellyfin stream
- Emby file
- Local file
- Alternate resolution
- Alternate language

Playback variants are resolved by the playout subsystem near airtime.

### Normalized Metadata

Metadata represented using ChannelForge-owned fields and controlled values
rather than source-specific payloads.

### Metadata Provenance

The recorded origin of a metadata value.

Examples:

- Plex
- Jellyfin
- Emby
- TMDb
- TVDB
- User override
- Derived ChannelForge rule
- Programming pack

### Derived Metadata

Metadata calculated by ChannelForge rather than directly supplied by a source.

Examples:

- Era
- Mood
- Holiday relevance
- Audience classification
- Franchise relationship

### Programming Asset

A catalog item intended to be scheduled as primary content.

Examples:

- Movie
- Episode
- Short

### Presentation Asset

A catalog item used to construct the broadcast presentation.

Examples:

- Bumper
- Ident
- Promo
- Trailer
- Interstitial
- Filler

## Template and Community Terms

### Network Template

A versioned editable definition used to create a network configuration.

A template may define:

- Preferred genres
- Excluded genres
- Audience profile
- Runtime preferences
- Dayparts
- Programming blocks
- Weights
- Scheduling rules
- Health targets

A template creates a network configuration snapshot. Existing networks must not
silently change when the source template is updated.

### Template Snapshot

The resolved template configuration copied into a network when the network is
created or explicitly updated.

### Programming Pack

A portable, versioned community package containing some combination of:

- Network definitions
- Templates
- Scheduling rules
- Branding
- Logos
- Bumpers
- Presentation assets
- Metadata
- Compatibility declarations

### Pack Manifest

The machine-readable file describing a programming pack's identity, version,
contents, requirements, and compatibility.

### Community Registry

A future service or index for discovering templates, programming packs, and
plugins.

A registry is not required for local import and export.

## Branding Terms

### Branding

The visual and presentational identity of a network.

Branding may include:

- Logo
- Wordmark
- Colors
- Typography
- Channel bug
- Bumpers
- Idents
- Guide artwork

### Channel Bug

A small persistent or intermittent on-screen network logo.

### Bumper

A short transition asset placed between programs or segments.

### Ident

A station-identification asset representing the network or channel.

### Interstitial

Short-form material scheduled between primary programs.

## Runtime Terms

### Playout

The operational process of converting an approved schedule into a live stream.

Playout includes:

- Resolving playback sources
- Starting and supervising FFmpeg
- Handling transitions
- Applying transcoding settings
- Recovering from failed media
- Tracking the currently airing entry
- Serving active stream sessions

### Playout Session

The active runtime state responsible for producing or serving one channel's
stream.

### Stream Session

A client-facing or shared streaming session created from playout output.

### Transcoding

Decoding and re-encoding media into a required output format.

### Remuxing

Changing the media container without re-encoding compatible audio and video
streams.

### Output Adapter

A component that exposes ChannelForge channel and schedule state through a
specific protocol or format.

Initial outputs include:

- IPTV/M3U
- XMLTV
- HDHomeRun-compatible endpoints
- Live stream endpoints

### Guide

The program schedule information exposed to clients.

### XMLTV

The XML-based electronic program guide format generated from approved schedule
data.

### IPTV Playlist

An M3U or M3U8 document listing available ChannelForge channels and stream
endpoints.

### HDHomeRun Compatibility

The set of discovery, lineup, guide, and stream behaviors needed for compatible
clients to treat ChannelForge as a network tuner.

## Operational Terms

### Import

The process of retrieving and normalizing metadata from a media source.

### Synchronization

The process of reconciling source changes with existing ChannelForge catalog
records.

### Worker

A background execution context responsible for asynchronous tasks such as:

- Media imports
- Metadata enrichment
- Schedule generation
- Guide generation
- Cleanup
- Health analysis

### Job

A tracked unit of asynchronous work.

### Revision

A versioned representation of a mutable configuration or generated artifact.

### Active Revision

The revision currently used for scheduling, playout, or output.

### Draft Revision

A revision that may be edited but is not operationally active.

### Health Metric

A calculated measurement describing the condition of a network or schedule.

Examples:

- Repeat frequency
- Genre balance
- Runtime balance
- Programming diversity
- Movie-to-television ratio
- Audience consistency
- Schedule coverage

### Recommendation

An explainable action suggested by the Programming Director based on one or more
health metrics or rules.

Every recommendation must identify the evidence and rule that produced it.

## User and Security Terms

### User

A person with an authenticated ChannelForge account.

### Role

A named collection of permissions.

Initial role design will be defined in the security specification.

### Permission

Authorization to perform a specific action against a resource.

### Administrator

A user with instance-level configuration and management permissions.

### Operator

A user permitted to manage networks, schedules, and playout without necessarily
controlling instance-wide security settings.

### Viewer

A user with read-only access to permitted management information.

### Secret

Sensitive configuration such as media-server tokens, API keys, and signing
material.

Secrets must not be returned through ordinary API responses or stored in
exported templates and programming packs.

## Compatibility Terms

### Inherited Runtime

Tunarr-derived code retained or adapted to provide existing virtual television
capabilities.

### Compatibility Layer

The boundary translating between ChannelForge-native models and inherited
runtime models.

### Legacy Identifier

An identifier retained from inherited data or APIs for migration and
compatibility purposes.

### Canonical Identifier

A stable ChannelForge-owned identifier used as the primary identity of an
entity.

### Migration

A controlled process that transforms inherited configuration, database records,
paths, or terminology into ChannelForge-native equivalents.

## Reserved Distinctions

The following distinctions are mandatory:

| Term A | Term B | Required distinction |
| --- | --- | --- |
| Network | Channel | Editorial identity versus output feed |
| Programming | Playout | Schedule decision-making versus stream execution |
| Schedule plan | Lineup | Versioned planning artifact versus ordered runtime result |
| Template | Network | Reusable defaults versus persistent user-owned configuration |
| Catalog item | Source binding | ChannelForge media identity versus external-system record |
| Rule | Recommendation | Deterministic evaluation versus user-facing advice |
| Hard constraint | Weight | Mandatory requirement versus scoring influence |
| Programming asset | Presentation asset | Primary content versus broadcast presentation material |
| Import | Synchronization | Initial ingestion versus ongoing reconciliation |
| Canonical identifier | Legacy identifier | ChannelForge identity versus compatibility reference |
