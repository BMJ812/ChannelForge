# ChannelForge Architecture & Design Specification

- **Version:** 0.1
- **Status:** Draft
- **Project phase:** Architecture and foundation
- **Last updated:** 2026-07-26

## Purpose

This specification defines the intended architecture, domain model, service
boundaries, scheduling behavior, persistence strategy, extension points, and
runtime responsibilities of ChannelForge.

ChannelForge is derived in part from the Tunarr runtime foundation but
introduces a separate network-first product and domain model.

The governing product principle is:

> Build television networks, not playlists.

Application implementation should follow this specification. When code and the
specification disagree during the architecture phase, the discrepancy must be
resolved explicitly rather than silently treating the existing implementation
as authoritative.

## Scope of Version 0.1

Version 0.1 defines:

1. Terminology
2. System context
3. Domain boundaries
4. Network and channel model
5. Media catalog model
6. Deterministic scheduling model
7. Scheduling and playout separation
8. Integration boundaries
9. Persistence direction
10. API conventions
11. Plugin boundaries
12. Deployment model
13. Security model
14. Testing strategy
15. Migration from inherited Tunarr concepts

Version 0.1 does not define every user-interface component or advanced
marketplace feature.

## Specification Documents

| Document | Status | Purpose |
| --- | --- | --- |
| `01-terminology.md` | Draft | Defines canonical ChannelForge terms |
| `02-system-context.md` | Draft | Defines users, external systems, and runtime boundaries |
| `03-domain-model.md` | Planned | Defines core entities and relationships |
| `04-scheduling-model.md` | Planned | Defines deterministic schedule generation |
| `05-media-catalog.md` | Planned | Defines normalized media metadata and source bindings |
| `06-playout-and-output.md` | Planned | Defines FFmpeg, stream sessions, XMLTV, IPTV, and HDHomeRun |
| `07-integrations.md` | Planned | Defines Plex, Jellyfin, Emby, and future adapter contracts |
| `08-persistence.md` | Planned | Defines SQLite v1 persistence and repository boundaries |
| `09-api.md` | Planned | Defines REST API conventions and contracts |
| `10-plugins.md` | Planned | Defines extension points, permissions, and isolation |
| `11-security.md` | Planned | Defines authentication, authorization, and secret handling |
| `12-deployment.md` | Planned | Defines Docker, Compose, and Unraid requirements |
| `13-testing.md` | Planned | Defines deterministic, integration, and platform testing |
| `14-migration.md` | Planned | Defines the controlled transition from inherited Tunarr concepts |

## Architectural Principles

1. A network is not merely a playlist.
2. Scheduling and playout are separate subsystems.
3. Schedule generation must be deterministic when inputs and seed are equal.
4. Hard constraints cannot be overridden by weighted preferences.
5. The normalized catalog is independent of any single media server.
6. ChannelForge-owned identifiers remain stable when source systems change.
7. Existing Tunarr runtime components are adapted behind explicit boundaries.
8. SQLite remains the initial persistence engine unless replaced by an accepted
   architecture decision.
9. Plugins receive only declared capabilities.
10. Docker Compose is the canonical deployment definition.
11. Unraid support wraps the canonical container configuration.
12. Explainability is required for programming recommendations.
13. Backward compatibility must be intentional rather than accidental.
14. Major architectural changes require Architecture Decision Records.

## Document Status Terms

- **Planned:** The document has not been written.
- **Draft:** The document exists but remains open to change.
- **Accepted:** The document is approved as the current implementation target.
- **Superseded:** A later document or ADR replaces it.
- **Deprecated:** Retained for historical or migration purposes but should not
  guide new implementation.

## Change Process

Changes to this specification should:

1. Be made on a dedicated branch.
2. State the problem or decision being addressed.
3. Identify affected modules and compatibility concerns.
4. Include an ADR when the change alters a major architectural decision.
5. Be merged through a reviewed pull request.
