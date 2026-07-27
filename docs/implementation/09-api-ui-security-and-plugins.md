# Milestone 09: API, UI, Security, and Plugins

- **Roadmap version:** 0.1
- **Milestone status:** Draft
- **Last updated:** 2026-07-27
- **Risk classification:** External Surface / Security / Critical
- **Implementation authority:** Versioned API contracts, first-party UI migration, authentication, authorization, secrets, audit, and bounded plugin capabilities
## Purpose

This milestone completes the application-facing and extension-facing boundary
required before deployment hardening and release validation.

It defines versioned HTTP contracts, first-party UI migration, authentication,
authorization, browser sessions, API tokens, secret handling, audit, CSRF,
CORS, trusted-proxy behavior, SSRF defenses, upload security, plugin packages,
plugin manifests, permission grants, isolated extension execution, plugin
storage, plugin secrets, plugin jobs, compatibility-route retirement, security
testing, and release-entry evidence.

This milestone does not perform the final production release.

It establishes the secure and testable external surface consumed by Milestone
10.
## Governing Specifications

- `docs/architecture/spec/01-terminology.md`
- `docs/architecture/spec/02-system-context.md`
- `docs/architecture/spec/03-domain-model.md`
- `docs/architecture/spec/04-scheduling-model.md`
- `docs/architecture/spec/05-media-catalog.md`
- `docs/architecture/spec/06-playout-and-output.md`
- `docs/architecture/spec/07-integrations.md`
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
- `docs/implementation/06-networks-and-channels.md`
- `docs/implementation/07-deterministic-scheduling.md`
- `docs/implementation/08-publication-playout-and-output.md`

## Milestone Mission

- Expose ChannelForge as a coherent television-network management system.
- Use ChannelForge domain language rather than inherited database terminology.
- Separate management, runtime, artifact, streaming, webhook, health, and compatibility surfaces.
- Provide stable versioned contracts for the first-party web interface and automation.
- Enforce authentication and authorization on the server.
- Protect credentials, tokens, backups, publication state, runtime control, and managed files.
- Use idempotency for safe mutation retries.
- Use optimistic concurrency for mutable resources.
- Represent long-running operations through Background Jobs.
- Keep protocol-compatible output routes separate from JSON APIs.
- Migrate first-party UI features without duplicate writes.
- Permit plugins only through declared capabilities and permissions.
- Prevent plugins from bypassing domain validation or reading internal tables.
- Contain plugin failures and preserve core operation.
- Retire compatibility routes only after usage and support-window gates pass.
- Produce OpenAPI, security, permission, threat-model, and compatibility evidence.

## Product Principle

The governing product principle remains:

> Build television networks, not playlists.

The API and UI present Networks, Channels, programming revisions, Schedule
Plans, Publications, Media Sources, and Catalog Items as first-class concepts.

Legacy playlist-oriented DTOs may remain behind compatibility adapters during
migration. They do not define the ChannelForge v1 contract.
## Core Principles

1. API resources use ChannelForge-owned identities.
2. Database row identifiers are not external contracts.
3. Provider identifiers remain qualified and scoped.
4. Management APIs are authenticated by default.
5. Authorization is enforced server-side.
6. Public output is separately configurable.
7. Mutations are explicit domain commands.
8. Long-running work returns Background Jobs.
9. Safe retries use idempotency keys.
10. Mutable resources use optimistic concurrency.
11. Errors are structured and stable.
12. Collection ordering and pagination are deterministic.
13. Sensitive fields are omitted or redacted.
14. Browser sessions are explicit and revocable.
15. API tokens are scoped, expiring where configured, and revocable.
16. Secrets are encrypted or externally managed.
17. CSRF, CORS, trusted-proxy, and SSRF policy are explicit.
18. Audit covers privileged and integrity-sensitive actions.
19. Plugins extend declared ports only.
20. Plugin permissions follow least privilege.
21. Plugin state and secrets are namespaced.
22. Plugin jobs are bounded and observable.
23. Plugin output is validated before activation.
24. Disabling a plugin stops new execution.
25. Uninstalling a plugin preserves historical references.
26. The first-party UI uses the same stable contracts as automation.
27. Legacy route use is measured before removal.
28. OpenAPI and implementation remain synchronized.
29. Security controls are testable.
30. Core operation remains possible when optional plugins fail.

## Scope

- Instance setup and authentication
- Users, roles, permissions, sessions, and API tokens
- Media Sources, libraries, Catalog, Networks, and Channels
- Programming revisions, scheduling, approval, and publication
- Runtime state and playout control
- Background Jobs, health, audit, backup, and restore preparation
- XMLTV, M3U, HDHomeRun-compatible, stream, and webhook routes
- First-party UI migration and accessibility
- Plugin package installation and lifecycle
- Plugin extension contracts and capability grants
- Legacy compatibility routes and retirement evidence

## Non-Goals

- GraphQL or gRPC as required v1 APIs
- Public multi-tenant SaaS contracts
- Unauthenticated administrative APIs
- Arbitrary database query APIs
- Remote code execution APIs
- Arbitrary shell-command plugins
- Native binary plugins
- Kernel-level plugin sandboxing
- Enterprise SAML or OIDC
- Mandatory MFA
- Remote plugin marketplace installation
- Final release packaging
- Deletion of every legacy route in one change

## API Surface Separation

### Management API

Authenticated JSON commands and queries for administrative and editorial workflows.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

### Runtime API

Authenticated operational state and elevated runtime controls.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

### Output Artifact API

XMLTV, M3U, logos, guide artwork, exports, and authorized bundles.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

### Streaming API

Long-lived live Channel output with stream-specific authorization.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

### HDHomeRun-Compatible API

Protocol-compatible discovery and lineup without redefining Channel identity.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

### Webhook Ingress API

Verified, bounded event hints that queue jobs.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

### Health and Diagnostics API

Minimal public liveness and authenticated diagnostic detail.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

### Compatibility API

Measured inherited routes isolated from canonical v1 contracts.
- Has an explicit authentication policy.
- Has an explicit authorization policy.
- Has route-class-specific rate limits.
- Has documented timeout and caching behavior.
- Has contract and security tests.

## Base Paths

Suggested roots:

```text
/api/v1
/runtime/v1
/stream
/xmltv
/playlist
/hdhomerun
/webhooks
/health
/compat
```

Protocol compatibility may preserve inherited paths during the support window.
## API Versioning

- Management APIs use a major version in the path.
- Breaking changes require a new major version or explicit compatibility strategy.
- Minor evolution is additive.
- Enumeration forward compatibility is documented per field.
- Deprecation includes replacement, support period, usage metrics, and removal guidance.
- Route removal occurs in a dedicated reviewed change.

## Representation Conventions

- Management JSON uses UTF-8 `application/json`.
- Paths use lowercase plural nouns and hyphenated multiword names.
- Opaque IDs are case-sensitive and preserved exactly.
- Timestamps use RFC 3339-compatible UTC strings.
- Editorial local time is paired with IANA time-zone context.
- Durations use integer milliseconds unless otherwise typed.
- JSON fields use lower camel case.
- Enumerations use stable uppercase snake case.
- Omitted, null, empty, zero, and false remain distinct.
- Future money values use exact minor units or decimal strings with a currency code.

## Structured Errors

Canonical management errors use:

```json
{
  "error": {
    "code": "CHANNEL_NUMBER_CONFLICT",
    "message": "The requested Channel number is already active.",
    "requestId": "req_...",
    "retryable": false,
    "details": [],
    "links": {}
  }
}
```

Protocol routes use protocol-compatible failures rather than this JSON envelope.
- `INVALID_REQUEST`
- `AUTHENTICATION_REQUIRED`
- `AUTHENTICATION_FAILED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VERSION_CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `RATE_LIMITED`
- `BACKGROUND_JOB_FAILED`
- `DEPENDENCY_UNAVAILABLE`
- `VALIDATION_FAILED`
- `LEGACY_WRITE_FROZEN`
- `PLUGIN_PERMISSION_DENIED`
- `PLUGIN_INCOMPATIBLE`
- `INTERNAL_ERROR`

## HTTP Status Policy

- `200` successful read or synchronous command
- `201` resource created
- `202` Background Job accepted
- `204` successful command without representation
- `304` immutable artifact not modified
- `400` malformed request
- `401` authentication required or failed
- `403` authenticated but unauthorized
- `404` missing or concealed resource
- `409` domain or idempotency conflict
- `412` optimistic-concurrency precondition failure
- `413` body or upload too large
- `415` unsupported media type
- `422` domain validation failure where selected
- `429` rate limited
- `500` unexpected internal failure
- `503` unavailable or not ready

## Idempotency

- Designated mutation endpoints accept an idempotency key.
- Store key, actor, route, request hash, response reference, and expiration.
- Same key and same request return the original result.
- Same key and different request return `IDEMPOTENCY_CONFLICT`.
- Concurrent duplicates do not duplicate side effects.
- Retries of Background Job commands return the original job.
- Authorization and resource scope remain enforced.

## Optimistic Concurrency

- Mutable resources expose ETag or version.
- Mutation requires `If-Match` or expected version where conflict risk matters.
- Compare and update occur atomically.
- Stale mutation returns a stable version conflict.
- Activated immutable revisions are never patched.
- First-party UI preserves and submits concurrency tokens.

## Pagination, Filtering, Sorting, and Search

- Cursor pagination is preferred for large mutable collections.
- Cursor binds to sort and filter fingerprints.
- Every sort ends with a stable ID tie-break.
- Unknown filters and sorts fail explicitly.
- Missing, null, false, empty, and zero remain distinct.
- Search is a derived projection.
- Search degradation does not remove direct resource reads.
- Query complexity and result size are bounded.

## Background Jobs

Long-running operations return a Background Job.

```text
backgroundJobId
jobType
state
progress
stage
createdAt
startedAt
completedAt
requestedBy
cancellationState
resultReference
failureCode
failureSummary
correlationId
```
- Jobs are observable.
- Cancellation is explicit.
- Retryability is documented.
- Results link to canonical resources.
- Failures are structured.
- Restart-safe operations recover from checkpoints.
- Sensitive diagnostics require elevated permission.

## Bulk Operations

- Bulk requests are bounded.
- Each item has a client correlation key.
- Atomic versus partial behavior is explicit.
- Large work returns a Background Job.
- Per-item results are retained.
- Authorization and domain validation apply to every item.

## Uploads and Downloads

- Uploads enter staging.
- Validate size, MIME, file signature, archive paths, file count, and decompression ratio.
- Storage paths are generated by ChannelForge.
- Checksums are calculated before activation.
- Downloads require authorization and never expose arbitrary host paths.
- Immutable downloads support ETags.
- Diagnostic bundles are bounded and redacted.

## Webhook Ingress

- Verify sender according to provider contract.
- Bound request size and rate.
- Deduplicate and protect against replay where possible.
- Return quickly.
- Queue a Background Job.
- Re-read provider state.
- Never treat webhook payload as canonical state without verification.

## OpenAPI

- Canonical Management API is represented in OpenAPI.
- Authentication and authorization requirements are declared.
- Deprecated routes are marked.
- Examples omit secrets.
- Reusable errors and Background Job schemas are defined.
- CI checks implementation and contract drift.
- First-party typed clients derive from or validate against the contract.

## Canonical Resource Work Packages

### Instance API Work Package

The `Instance` resource represents setup state, defaults, build information, and security posture.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### User API Work Package

The `User` resource represents identity, lifecycle, roles, and session visibility.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### ApiToken API Work Package

The `ApiToken` resource represents scope, prefix, expiration, last use, and revocation.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### MediaSource API Work Package

The `MediaSource` resource represents provider-independent configuration and health.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### LibraryBinding API Work Package

The `LibraryBinding` resource represents library inclusion and synchronization policy.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### CatalogItem API Work Package

The `CatalogItem` resource represents normalized media identity and effective metadata.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### SourceBinding API Work Package

The `SourceBinding` resource represents qualified external identity and availability.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### PlaybackVariant API Work Package

The `PlaybackVariant` resource represents technical playback realization.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### CatalogConflict API Work Package

The `CatalogConflict` resource represents durable ambiguity and operator resolution.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### Collection API Work Package

The `Collection` resource represents static, dynamic, or hybrid programming membership.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### Network API Work Package

The `Network` resource represents editorial identity and active revisions.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### Channel API Work Package

The `Channel` resource represents tuneable identity, number, output identity, and lifecycle.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### BrandingProfileRevision API Work Package

The `BrandingProfileRevision` resource represents immutable branding configuration.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### ProgrammingConfigurationRevision API Work Package

The `ProgrammingConfigurationRevision` resource represents immutable scheduling intent.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### GenerationRequest API Work Package

The `GenerationRequest` resource represents deterministic planning command.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### SchedulePlan API Work Package

The `SchedulePlan` resource represents immutable generated plan.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### ValidationResult API Work Package

The `ValidationResult` resource represents plan checksum and findings.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### ApprovalRecord API Work Package

The `ApprovalRecord` resource represents explicit plan approval.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### SchedulePublication API Work Package

The `SchedulePublication` resource represents active approved-plan selection.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### PublishedArtifact API Work Package

The `PublishedArtifact` resource represents versioned XMLTV, M3U, lineup, or export.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### PlayoutSession API Work Package

The `PlayoutSession` resource represents shared Channel runtime execution.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### AiringRecord API Work Package

The `AiringRecord` resource represents actual runtime result.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### BackgroundJob API Work Package

The `BackgroundJob` resource represents long-running work state.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### AuditRecord API Work Package

The `AuditRecord` resource represents append-oriented privileged action.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### PluginRegistration API Work Package

The `PluginRegistration` resource represents installed plugin identity and trust.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### PluginInstance API Work Package

The `PluginInstance` resource represents configured use of a plugin.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

### PluginPermissionGrant API Work Package

The `PluginPermissionGrant` resource represents approved plugin capability.
- Use a ChannelForge-owned opaque ID.
- Define collection and single-resource routes.
- Define create or command routes where applicable.
- Define lifecycle states.
- Define ETag or immutability behavior.
- Define authorization permission and resource scope.
- Define structured errors.
- Define pagination or ordering where applicable.
- Omit secrets and internal persistence details.
- Add OpenAPI and contract tests.
- Add first-party typed client coverage.
- Add compatibility mapping where inherited callers exist.

## First-Party UI Architecture

- The UI is an API client and does not receive internal database access.
- Server validation and authorization remain authoritative.
- Typed requests and responses are used.
- Authentication, structured errors, ETags, idempotency, cancellation, and pagination are centralized.
- Optimistic UI is used only where rollback is safe.
- Background Jobs are represented explicitly.
- No action submits to both legacy and canonical routes.
- Sensitive values are not persisted in browser storage without an approved design.
- Page refresh reconstructs state from the API.
- Runtime reconnect behavior is bounded.

## UI Application Areas

- Setup
- Authentication
- Dashboard
- Media Sources
- Catalog
- Networks
- Channels
- Programming
- Scheduling
- Publication
- Runtime
- Output
- Background Jobs
- Audit
- Backups
- Users and Access
- Plugins
- Diagnostics
- Settings

## UI Migration Work Packages

### Setup UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Authentication UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Dashboard UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Media Sources UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Catalog UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Networks UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Channels UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Programming UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Scheduling UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Publication UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Runtime UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Output UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Background Jobs UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Audit UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Backups UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Users and Access UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Plugins UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Diagnostics UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

### Settings UI Migration

- Inventory inherited routes and DTOs.
- Map the workflow to canonical resources and commands.
- Implement typed client operations.
- Preserve loading, empty, error, conflict, and permission states.
- Use ETags and idempotency where applicable.
- Prevent duplicate submission.
- Add feature flag and rollback.
- Add responsive and accessibility behavior.
- Add unit, integration, and workflow tests.
- Measure legacy route use after cutover.
- Remove the first-party legacy caller.

## Accessibility

- Keyboard navigation and visible focus
- Semantic landmarks and headings
- Associated labels and accessible descriptions
- Accessible validation messages
- Color-independent status indicators
- Live regions for job progress and runtime changes
- Navigable tables and timelines
- Nonvisual timeline summaries
- Correct dialog focus management
- Reduced-motion support
- Documented contrast target

## Responsive UI

- Desktop supports dense operational tables and timelines.
- Tablet supports primary editing and monitoring.
- Mobile supports status, approvals, simple edits, and recovery actions.
- Critical controls are not hidden solely by viewport size.
- Wide tables have stacked or horizontal-scroll alternatives.
- Timeline views have compact summaries.

## Authentication

- Version 1 supports browser sessions, scoped API tokens, initial setup token, and optional trusted-proxy authentication.
- Every user has a ChannelForge-owned User ID.
- Display name is not identity.
- Disabled users cannot create sessions or tokens.
- Archived users preserve audit lineage.
- Unknown or failed login uses a generic message.

## Initial Setup

- Available only before an administrator exists or through explicit reset workflow.
- Uses a high-entropy short-lived setup token.
- Rate limits attempts.
- Never logs the token.
- Successful setup invalidates the token.
- Creates the initial administrator and security defaults.
- Cannot be restarted through an ordinary unauthenticated request.

## Password Security

- Use Argon2id or scrypt unless a documented platform constraint requires another modern function.
- Use per-password salt.
- Version parameters with the verifier.
- Support rehash on successful login.
- Use constant-time verification.
- Favor length over arbitrary composition rules.
- Permit password managers, spaces, and Unicode.
- Do not trim, log, or echo passwords.
- Bound maximum length before expensive hashing.
- Rate limit authentication.

## Browser Sessions

- Store opaque Session ID, User ID, creation time, last activity, expirations, credential version, revocation state, and CSRF binding.
- Use HttpOnly cookies.
- Use Secure cookies when HTTPS is used.
- Use an explicit SameSite policy.
- Rotate after authentication or privilege elevation.
- Support sign-out and administrator revocation.
- Password or role changes follow a documented invalidation policy.

## API Tokens

- Show token value once.
- Store only a verifier or keyed hash.
- Use a recognizable nonsecret prefix.
- Assign scopes and optional resource constraints.
- Support expiration and revocation.
- Reject query-string token use except documented protocol exceptions.
- Audit privileged token actions.
- Never return the full value after creation.

## Authorization

Authentication establishes identity.

Authorization decides whether that identity may perform one operation on one
resource.

UI visibility is not authorization.
- `VIEWER`
- `OPERATOR`
- `EDITOR`
- `APPROVER`
- `PUBLISHER`
- `SOURCE_MANAGER`
- `PLUGIN_MANAGER`
- `SECURITY_ADMIN`
- `ADMINISTRATOR`

- `INSTANCE_READ`
- `INSTANCE_CONFIGURE`
- `USER_READ`
- `USER_MANAGE`
- `SESSION_REVOKE`
- `TOKEN_CREATE`
- `TOKEN_REVOKE`
- `MEDIA_SOURCE_READ`
- `MEDIA_SOURCE_MANAGE`
- `MEDIA_SOURCE_CREDENTIAL_MANAGE`
- `CATALOG_READ`
- `CATALOG_MANAGE`
- `CATALOG_CONFLICT_RESOLVE`
- `NETWORK_READ`
- `NETWORK_EDIT`
- `NETWORK_ACTIVATE`
- `CHANNEL_READ`
- `CHANNEL_EDIT`
- `CHANNEL_OPERATE`
- `PROGRAMMING_READ`
- `PROGRAMMING_EDIT`
- `SCHEDULE_GENERATE`
- `SCHEDULE_APPROVE`
- `PUBLICATION_ACTIVATE`
- `PUBLICATION_ROLLBACK`
- `PLAYOUT_READ`
- `PLAYOUT_CONTROL`
- `OUTPUT_READ`
- `OUTPUT_CONFIGURE`
- `AUDIT_READ`
- `BACKUP_CREATE`
- `BACKUP_RESTORE_PREPARE`
- `PLUGIN_READ`
- `PLUGIN_INSTALL`
- `PLUGIN_APPROVE`
- `PLUGIN_CONFIGURE`
- `PLUGIN_ENABLE`
- `PLUGIN_DISABLE`
- `PLUGIN_UNINSTALL`
- `DIAGNOSTICS_READ`
- `SECURITY_CONFIGURE`

## Authorization Requirements

- Deny by default.
- Unknown roles and permissions deny.
- Resource scope may be instance, Network, Channel, Media Source, Plugin, or job-owner scoped.
- Application services enforce decisions.
- Privileged actions fail closed when authorization is unavailable.
- Decision diagnostics identify principal, permission, resource, scope, policy version, and request ID.

## Secret Service

- Media Source credential
- API token verifier
- Session signing key
- Plugin secret
- Webhook secret
- Proxy credential
- Backup encryption material
- Stream-signing secret

- Store Secret References in ordinary domain records.
- Do not store plaintext reusable secrets in ordinary tables.
- Do not expose secrets through ordinary API responses.
- Do not log secrets.
- Support key versions, rotation, revocation, and access attribution.
- Keep key material separate from the database where practical.
- Fail explicitly when required key material is unavailable.

## CSRF, CORS, and Trusted Proxy

- Cookie-authenticated state-changing requests require CSRF protection.
- Safe methods do not mutate state.
- Management CORS denies untrusted origins by default.
- Credentialed wildcard origins are prohibited.
- Stream and artifact CORS have separate policy.
- Forwarded headers are trusted only from configured proxies.
- Public base URL overrides request-derived values where configured.
- Untrusted forwarded headers never affect authentication, authorization, or artifact URLs.

## SSRF Defenses

- Validate Media Source and plugin outbound URLs.
- Bound redirects.
- Block credential forwarding to unrelated hosts.
- Protect link-local and metadata-service addresses.
- Apply DNS rebinding defenses where practical.
- Declare plugin destination hosts or classes.
- Do not provide arbitrary URL-fetch diagnostics.
- Use controlled HTTP clients with timeouts and response limits.

## File, Upload, and Backup Security

- Managed storage owns writable files.
- Media mounts are read-only by default where practical.
- Reject path traversal and symlink escape.
- Bound archive extraction.
- Validate MIME and file signatures.
- Use restricted temporary files.
- Treat backups as sensitive.
- Authorize backup creation and restore preparation.
- Do not silently overwrite active state during restore.
- Redact backup and support-bundle logs.

## Audit

- Setup completion
- Credential change
- Role or permission change
- Token creation or revocation
- Media Source credential rotation
- Network or Channel activation
- Schedule approval
- Publication activation or rollback
- Runtime control
- Backup or restore preparation
- Plugin installation
- Plugin trust decision
- Plugin permission grant
- Plugin lifecycle change
- Legacy write freeze
- Compatibility route removal
- Security-policy change

- Audit is append-oriented.
- Secrets are omitted.
- Immutable IDs and checksums are included where relevant.
- Retention and export permission are explicit.
- Critical audit failure follows an explicit fail-closed policy.

## Logging, Privacy, and Supply Chain

- Redact passwords, tokens, cookies, signed URLs, plugin secrets, and keys.
- Bound client-address and user-agent retention.
- Do not create behavioral viewer profiles in version 1.
- Support bundles are previewable and redacted.
- Lock dependency versions and review updates.
- Run vulnerability scans.
- Verify release and plugin package checksums.
- Preserve Tunarr license and attribution.
- Document FFmpeg provenance and version.

## Container Hardening

- Run as non-root where practical.
- Support PUID and PGID.
- Persist `/config` with required permissions.
- Mount media read-only where practical.
- Expose only required ports.
- Document UDP discovery requirements.
- Avoid Docker socket access.
- Declare GPU devices explicitly.
- Bound temporary storage.
- Provide health checks.

## Plugin Architecture

Plugins extend declared ports.

They do not become indistinguishable from core code.

Version 1 favors declarative contributions or isolated execution over
unrestricted in-process third-party packages.
## Plugin Package and Manifest

- Manifest schema version
- Plugin ID
- Display name
- Plugin version
- Publisher
- Description
- License
- ChannelForge compatibility range
- Runtime type
- Entrypoint
- Extension points
- Capabilities
- Required permissions
- Optional permissions
- Configuration schemas
- Secret schemas
- Resource limits
- Network declarations
- Storage declarations
- UI contributions
- Migration declarations
- Signature metadata
- Package checksum

- Reject unknown fields unless the schema explicitly permits extension objects.
- Validate package paths, file count, size, entrypoint, permissions, compatibility, checksum, and signature.
- Installed package content is immutable.
- Package checksum covers manifest, code, schemas, assets, migrations, and notices.

## Plugin Trust

- `VERIFIED_PROJECT`
- `VERIFIED_PUBLISHER`
- `VERIFIED_LOCAL`
- `UNSIGNED`
- `INVALID`
- `UNKNOWN_PUBLISHER`
- `REVOKED`

- Instance policy may allow project-signed only, trusted publishers, locally approved unsigned packages, development plugins, or no external plugins.
- Unsigned or unknown-publisher installation requires elevated confirmation when allowed.
- Revocation blocks new installation and triggers operator remediation.

## Plugin Lifecycle

- `UPLOADED`
- `VALIDATING`
- `AWAITING_APPROVAL`
- `INSTALLING`
- `INSTALLED`
- `ENABLING`
- `ENABLED`
- `DISABLING`
- `DISABLED`
- `UPGRADING`
- `FAILED`
- `UNINSTALLING`
- `UNINSTALLED`
- `QUARANTINED`

### Installation

1. Stage package
2. Validate archive
3. Validate manifest
4. Verify checksum and signature
5. Review permissions
6. Create registration
7. Keep disabled

### Enable

1. Verify package integrity
2. Verify compatibility
3. Verify grants and secrets
4. Start runtime
5. Register contributions
6. Run health check

### Disable

1. Stop new execution
2. Stop or drain jobs
3. Withdraw contributions
4. Revoke secret handles
5. Preserve state

### Upgrade

1. Stage new version
2. Compare permissions
3. Back up state
4. Run bounded migration
5. Activate atomically
6. Retain rollback

### Uninstall

1. Require disabled state
2. Withdraw dependencies
3. Choose state retention
4. Revoke secrets
5. Preserve audit and history

## Plugin Extension Points

### MEDIA_SOURCE_ADAPTER

Provider-neutral media source adapter.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### METADATA_PROVIDER

Metadata candidates with provenance.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### ARTWORK_PROVIDER

Bounded artwork candidates.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### SCHEDULE_IMPORTER

Validated imported schedule.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### SCHEDULE_EXPORTER

Export from immutable schedule state.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### PROGRAMMING_RULE

Typed versioned rule evaluator.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### PROGRAMMING_TEMPLATE

Declarative configuration template.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### PROGRAMMING_PACK

Approved templates and assets.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### OUTPUT_GENERATOR

Validated artifact generator.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### NOTIFICATION_ADAPTER

Bounded outbound notification.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### HEALTH_CHECK

Diagnostic observation.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### DIAGNOSTIC_ANALYZER

Read-only bounded analysis.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### BACKUP_DESTINATION

Controlled backup adapter.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### UI_CONTRIBUTION

Limited declared ui contribution.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

### BACKGROUND_TASK

Bounded maintenance job.
- Uses a stable versioned extension contract.
- Declares required permissions.
- Does not access core tables.
- Does not bypass application validation.
- Uses namespaced state and secrets.
- Has bounded runtime and output.
- Has contract fixtures.
- Has failure containment.
- Has enable, disable, and compatibility tests.

## Plugin Permission Catalog

- `CATALOG_READ`
- `CATALOG_METADATA_PROPOSE`
- `CATALOG_ARTWORK_PROPOSE`
- `NETWORK_READ`
- `CHANNEL_READ`
- `PROGRAMMING_READ`
- `PROGRAMMING_RULE_EVALUATE`
- `SCHEDULE_READ`
- `SCHEDULE_IMPORT_PROPOSE`
- `SCHEDULE_EXPORT`
- `OUTPUT_ARTIFACT_PROPOSE`
- `NOTIFICATION_SEND`
- `HEALTH_REPORT`
- `DIAGNOSTIC_READ`
- `BACKUP_DESTINATION_WRITE`
- `PLUGIN_STORAGE_READ`
- `PLUGIN_STORAGE_WRITE`
- `PLUGIN_SECRET_READ`
- `PLUGIN_JOB_SUBMIT`
- `NETWORK_OUTBOUND`
- `UI_CONTRIBUTE`

- Required and optional permissions are separate.
- Operator grants are recorded.
- Every broker call rechecks permission.
- Scope may be limited to Plugin Instance, Network, Channel, Source, or destination allowlist.
- Upgrades requesting new permission require reapproval.
- Disabling revokes runtime use.

## Plugin Runtime, Storage, Secrets, and Jobs

### Plugin Runtime

Use declarative, built-in, development, or isolated-process modes; unrestricted third-party in-process execution is not the default.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin Storage

Namespace by Plugin Registration and Instance; enforce quota; prohibit direct core table access.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin Secrets

Store through Secret Service; expose scoped transient handles; prohibit enumeration of unrelated secrets.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin Jobs

Submit through Job Broker; bound concurrency, runtime, memory, output, and retries.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin Network

Deny by default; require declared destinations; apply SSRF, redirect, timeout, and rate policies.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin UI

Use declarative or approved isolated contributions; preserve accessibility and failure isolation.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin Rules

Require determinism, versioning, explanation, cost classification, and no live scoring-time network call.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin Adapters

Emit provider-neutral observations and normalize errors.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

### Plugin Output

Stage and validate artifacts before activation; preserve last-known-good output.
- Permission is explicit.
- Activity is observable.
- Failure is attributable.
- Disablement stops new work.
- Historical references remain interpretable.

## Plugin Failure Containment

- Runtime crash does not terminate the core application where isolation supports it.
- Repeated failure triggers backoff or quarantine.
- Core operation continues without optional plugins.
- Contributions withdraw cleanly.
- Jobs fail within plugin scope.
- Checksum, signature, permission, compatibility, and migration violations may quarantine a plugin.
- Quarantine preserves evidence and blocks execution.

## Compatibility API and UI Retirement

- Legacy routes remain in the compatibility registry.
- Every route has caller classification and usage metrics.
- First-party callers migrate before removal.
- Legacy mutations freeze server-side.
- Deprecation identifies replacement and support window.
- Historical contract fixtures remain.
- Removal requires zero supported use, release notes, and rollback closure.
- Legacy DTOs do not remain in canonical UI state.

## Persistence

- Users, roles, permission grants, sessions, API token verifiers
- Idempotency records and rate-limit state where durable
- Audit Records and Secret References
- Encryption key metadata
- Plugin Registrations, Instances, Permission Grants, State, Secrets, and Jobs
- Publisher Trust and Package Integrity Records
- UI feature flags and compatibility usage summaries

- Authentication verifiers are never plaintext.
- Audit is append-oriented.
- Plugin state is namespaced.
- Package files are immutable.
- Secret material is restricted.
- No plugin receives database credentials or raw table access.

## Observability

### API Metrics

- Request count
- latency
- status
- route template
- authentication class
- authorization denial
- idempotency replay
- version conflict
- rate limit
- deprecated use

### Security Metrics

- Authentication failure
- session revocation
- token use
- CSRF failure
- CORS rejection
- SSRF rejection
- upload rejection
- secret access failure
- audit failure

### Plugins Metrics

- Installed and enabled count
- signature state
- permission grants
- runtime starts
- crashes
- job failures
- network calls
- storage use
- quarantine

### UI Metrics

- Route errors
- job visibility
- concurrency conflicts
- legacy caller use
- accessibility result
- workflow result

## Testing Strategy

### API Contract Tests

- Resource schemas
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- errors
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- status codes
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- OpenAPI drift
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- versioning
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- deprecation
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Authentication Tests

- Valid login
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- invalid login
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- disabled user
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- rate limit
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- password rehash
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- session rotation
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Authorization Tests

- Role grant
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- resource scope
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- unknown permission
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- direct route bypass
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- privilege change
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Sessions Tests

- Expiration
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- idle timeout
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- absolute timeout
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- revocation
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- cookie flags
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- CSRF binding
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### API Tokens Tests

- Create
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- show once
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- scope
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- expiration
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- revocation
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- prefix lookup
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- query rejection
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Idempotency Tests

- Replay
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- conflict
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- concurrent duplicate
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- job retry
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- expiration
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Concurrency Tests

- Valid ETag
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- stale ETag
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- missing precondition
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- activation race
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- permission race
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Pagination Tests

- Stable order
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- cursor
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- filter fingerprint
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- sort fingerprint
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- mutation between pages
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### CSRF Tests

- Valid token
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- missing token
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- wrong origin
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- safe method
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- API-token request
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### CORS Tests

- Trusted origin
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- untrusted origin
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- credentialed wildcard rejection
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- preflight
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- stream policy
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### SSRF Tests

- Allowed source
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- metadata address
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- redirect
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- credential forwarding
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- plugin allowlist
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Uploads Tests

- Valid file
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- MIME mismatch
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- path traversal
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- archive bomb
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- symlink
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- oversize
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Audit Tests

- Critical event
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- secret omission
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- export authorization
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- retention
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- write failure
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Plugin Manifest Tests

- Valid manifest
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- unknown field
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- checksum mismatch
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- signature failure
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- compatibility failure
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Plugin Permissions Tests

- Grant
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- deny
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- scope
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- upgrade escalation
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- disable revocation
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Plugin Lifecycle Tests

- Install
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- enable
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- disable
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- upgrade
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- rollback
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- uninstall
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- quarantine
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Plugin Isolation Tests

- Crash
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- timeout
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- memory bound
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- job failure
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- network denial
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- storage quota
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### UI Tests

- Typed client
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- double-submit prevention
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- ETag conflict
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- job progress
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- error request ID
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Accessibility Tests

- Keyboard
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- focus
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- labels
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- live regions
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- timeline alternative
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- contrast
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

### Compatibility Tests

- Legacy fallback
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- write freeze
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- usage metric
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- first-party caller removal
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case
- route retirement
  - Success case
  - Rejection or failure case
  - Authorization or policy case
  - Structured diagnostic case

## Platform Validation

### Windows

- Path normalization
- atomic files
- plugin process launch
- termination
- file locking
- SQLite busy
- PowerShell workflow

### Linux

- Permissions
- signals
- process groups
- container user
- read-only mounts
- secret key permissions
- SQLite WAL

### Docker

- `/config` persistence
- ports
- trusted proxy
- secret persistence
- plugin cleanup
- health checks

### Unraid

- PUID/PGID
- host or bridge networking
- UDP discovery
- GPU permissions
- backup paths
- restart

## Documentation Deliverables

```text
docs/implementation/api-ui-security-plugins/
├── README.md
├── api-style-guide.md
├── api-surface-inventory.md
├── route-contracts.md
├── error-catalog.md
├── idempotency.md
├── optimistic-concurrency.md
├── pagination-filtering-sorting.md
├── background-jobs.md
├── webhooks.md
├── openapi-policy.md
├── ui-architecture.md
├── ui-migration-map.md
├── accessibility.md
├── authentication.md
├── authorization.md
├── permission-catalog.md
├── browser-sessions.md
├── api-tokens.md
├── secret-service.md
├── csrf-cors-proxy.md
├── ssrf.md
├── upload-security.md
├── audit.md
├── privacy-and-redaction.md
├── plugin-manifest.md
├── plugin-permissions.md
├── plugin-runtime.md
├── plugin-lifecycle.md
├── plugin-extension-points.md
├── plugin-ui-contributions.md
├── legacy-route-retirement.md
├── threat-model.md
├── security-test-report.md
├── decision-register.md
└── completion-report.md
```
## Recommended Pull-Request Sequence

### PR 09A: API Core Conventions

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09B: OpenAPI Foundation

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09C: Authentication Core

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09D: Browser Sessions

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09E: API Tokens

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09F: Authorization Service

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09G: Secret Service

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09H: CSRF, CORS, and Trusted Proxy

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09I: SSRF and Controlled HTTP

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09J: Idempotency

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09K: Optimistic Concurrency

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09L: Pagination and Search Contracts

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09M: Background Job API

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09N: Upload and Download Security

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09O: Webhook Ingress

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09P: Audit Service

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09Q: First Canonical UI Client

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09R: Media and Catalog UI Migration

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09S: Network and Channel UI Migration

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09T: Scheduling and Publication UI Migration

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09U: Runtime and Output UI Migration

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09V: Users and Security UI

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09W: Plugin Package and Manifest

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09X: Plugin Registry and Lifecycle

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09Y: Plugin Permission Broker

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09Z: Plugin Storage and Secrets

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AA: Plugin Job Broker

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AB: Plugin Extension Contracts

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AC: Plugin UI Contributions

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AD: Legacy Route Freeze

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AE: Legacy Route Retirement

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AF: Security Test Suite

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AG: Accessibility and Responsive Suite

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

### PR 09AH: Completion Report

- Define one bounded implementation concern.
- State API and OpenAPI impact.
- State authentication and authorization impact.
- State secret and audit impact.
- State UI and compatibility impact.
- State plugin impact where applicable.
- Include tests and rollback.
- Avoid unrelated refactoring.

## Entry Gates

1. Baseline inventory exists.
2. Module boundaries exist.
3. Identifier policy exists.
4. Persistence and migrations exist.
5. Compatibility framework exists.
6. Media Source and Catalog application contracts exist.
7. Network and Channel application contracts exist.
8. Scheduling application contracts exist.
9. Publication and runtime application contracts exist.
10. Background Job foundation exists.
11. Secret requirements are known.
12. Legacy route inventory exists.
13. Legacy first-party caller inventory exists.
14. Plugin architecture is accepted.
15. Security threat-model baseline exists.
16. Build passes.
17. Linux domain tests pass.
18. Windows issues are classified.

## Interstitial Programming and External Video Feeds Amendment

### Purpose

Milestone 09 owns management surfaces, authorization, Secret Service use,
security policy, audit, and plugin extension for the new capabilities.

### API Resources

Implement versioned API resources for:

- Presentation Assets
- Interstitial Pools
- Break Rules
- External Feeds
- External Feed Items
- Discovery Inbox
- Feed synchronization runs
- Matching decisions
- Rights decisions
- Playability decisions
- Eligibility explanations

### First-Party UI

Implement:

- Presentation Asset library
- Upload and Media Source linking
- Rights and playability controls
- Interstitial Pool editor
- Break Rule editor
- Break preview
- External Feed setup
- YouTube Channel and playlist resolution
- Feed synchronization history
- Discovery Inbox
- Catalog and Presentation Asset matching
- Network and Channel assignment
- Eligibility explanation
- Runtime break diagnostics

### Authorization

Add bounded permissions for:

- Presentation Asset read and manage
- Rights management
- Interstitial Pool read and manage
- External Feed read and manage
- External Feed credential management
- Manual synchronization
- Discovery Inbox review
- Matching decisions

### Security

Implement:

- URL scheme allowlist
- DNS and address validation
- SSRF protection
- Redirect revalidation
- Response-size limits
- Timeouts
- Content-type validation
- Hardened XML parsing
- Credential isolation
- API-key redaction
- Provider quota handling
- Rate limiting
- Audit
- Rejection of arbitrary shell execution
- Rejection of unsupported automatic downloads
- Rejection of arbitrary FFmpeg source creation

### Plugin Extension

Expose a bounded External Video Feed adapter capability.

Plugins may:

- Resolve feed identity
- Fetch bounded metadata
- Emit normalized observations
- Declare credentials and destinations
- Normalize provider errors

Plugins may not:

- Write directly to Catalog tables
- Write directly to Schedule Plans
- Bypass rights or playability policy
- Use undeclared network destinations
- Run arbitrary downloaders
- Log raw credentials

### Suggested Additional Pull Requests

#### PR 09: Presentation and Feed API

- Resource contracts
- Commands
- Errors
- Concurrency
- OpenAPI

#### PR 09: Management UI

- Asset library
- Pool and Break Rule editors
- Feed setup
- Discovery Inbox
- Matching workflow

#### PR 09: Remote Feed Security

- SSRF controls
- URL validation
- XML hardening
- Quota and credential failures

#### PR 09: External Feed Plugin Boundary

- Capability manifest
- Adapter contract
- Contract fixtures
- Permission enforcement

### Milestone 09 Completion Additions

Milestone 09 cannot be marked Complete until:

1. First-party workflows use canonical APIs.
2. Secrets are never returned through ordinary reads.
3. Remote-feed SSRF protections are verified.
4. Discovery Inbox decisions are auditable.
5. Rights and playability changes are auditable.
6. Plugin adapters cannot bypass domain policy.
7. Unsupported downloading and restreaming actions are rejected.
8. UI explains why an item is or is not schedule-eligible.

## Completion Gates

1. API surfaces are separated
2. Management API is versioned
3. Canonical route inventory exists
4. Compatibility route inventory exists
5. ChannelForge IDs are used
6. Provider IDs remain qualified
7. Structured errors exist
8. Status policy exists
9. Idempotency exists
10. Optimistic concurrency exists
11. Cursor pagination exists
12. Filtering is documented
13. Sorting is deterministic
14. Search degradation is explicit
15. Background Job resource exists
16. Job cancellation exists
17. Bulk semantics are explicit
18. Upload security exists
19. Download path safety exists
20. Webhook verification exists
21. Rate limiting exists
22. OpenAPI exists
23. OpenAPI drift check exists
24. Authentication is required by default
25. Initial setup is bounded
26. Modern password hashing exists
27. Browser sessions are secure and revocable
28. API tokens are scoped and revocable
29. Authorization Service exists
30. Roles and permissions are documented
31. Resource scope is enforced
32. UI visibility is not authorization
33. Secret Service exists
34. Secrets are omitted from APIs
35. Rotation and revocation exist
36. CSRF protection exists
37. CORS denies by default
38. Trusted-proxy policy exists
39. SSRF controls exist
40. Public output is opt-in
41. Security headers exist
42. Audit Service exists
43. Critical actions are audited
44. Logging redaction exists
45. Privacy and retention policy exists
46. Backup security exists
47. Supply-chain checks exist
48. Container-hardening guidance exists
49. Typed first-party client exists
50. First-party authentication is canonical
51. Media Source UI is canonical
52. Catalog UI is canonical
53. Network and Channel UI are canonical
54. Scheduling UI is canonical
55. Publication UI is canonical
56. Runtime UI is canonical
57. Security administration UI exists
58. UI does not double-submit
59. UI preserves ETags and idempotency
60. Accessibility baseline exists
61. Responsive workflow baseline exists
62. Plugin Package model exists
63. Plugin Manifest schema exists
64. Checksum validation exists
65. Signature and trust states exist
66. Plugin Registration exists
67. Plugin lifecycle exists
68. Plugin permissions are explicit
69. Permission grants are scoped
70. Plugin Runtime is bounded
71. Plugin storage is namespaced
72. Plugin secrets are scoped
73. Plugin jobs are bounded
74. Plugin network access is declared
75. Plugin output validates before activation
76. Plugin UI contributions are limited
77. Plugin failure is contained
78. Plugin disable stops new execution
79. Plugin uninstall preserves history
80. Plugin quarantine exists
81. Legacy first-party callers are removed
82. Legacy mutation routes are frozen
83. Deprecated route use is measured
84. Legacy removal gates exist
85. Secret sentinel tests pass
86. Authorization bypass tests pass
87. CSRF tests pass
88. CORS tests pass
89. SSRF tests pass
90. Plugin permission tests pass
91. Windows tests pass or failures are tracked
92. Linux tests pass
93. Docker validation passes
94. Unraid validation passes
95. Completion report exists
96. Milestone 10 entry is approved

## Completion Evidence

- OpenAPI checksum and drift result
- Canonical route inventory
- Deprecated route usage report
- First-party UI migration report
- Authentication and session results
- API token result
- Authorization matrix
- Secret sentinel result
- CSRF and CORS results
- Trusted-proxy result
- SSRF result
- Upload result
- Audit result
- Accessibility result
- Responsive workflow result
- Plugin manifest and signature results
- Plugin permission and lifecycle results
- Plugin crash-containment result
- Legacy write-freeze result
- Windows result
- Linux result
- Docker result
- Unraid result
- Open risks

## Rollback

### API

Keep prior supported route version and compatibility adapters.

### UI

Use feature flags without replaying duplicate commands.

### Authentication

Never downgrade password storage to a weaker scheme.

### Authorization

Restore a prior policy version without broadening grants.

### Secrets

Retain required key versions and never fall back to plaintext.

### Plugins

Disable and restore the prior compatible package and state.

### Legacy Routes

Re-register only with explicit authority and reconciliation.

## Risks

### Contract Drift

Implementation and OpenAPI diverge.

Mitigation:
- CI validation and contract tests.

### Authorization Gaps

A route omits enforcement.

Mitigation:
- Central policy and route coverage tests.

### Secret Leakage

Tokens appear in logs, URLs, or UI state.

Mitigation:
- Secret Service, redaction, and sentinels.

### Session Theft

Browser session is captured or fixed.

Mitigation:
- Secure cookies, rotation, revocation, and CSRF.

### Proxy Spoofing

Forwarded headers alter origin or identity.

Mitigation:
- Trusted-proxy allowlists and tests.

### SSRF

Sources or plugins access protected addresses.

Mitigation:
- Controlled HTTP and destination policy.

### UI Double Writes

Legacy and canonical callers both mutate.

Mitigation:
- One command path, feature flags, and idempotency.

### Plugin Escape

Plugin accesses host or core internals.

Mitigation:
- Isolation, brokers, and least privilege.

### Permission Creep

Upgrade requests more access silently.

Mitigation:
- Permission diff and reapproval.

### Unsigned Package Abuse

Malicious package is installed.

Mitigation:
- Trust policy, confirmation, and quarantine.

### Legacy Route Removal

Unknown automation breaks.

Mitigation:
- Usage metrics, support window, and release notes.

### Accessibility Regression

Dense UI becomes unusable.

Mitigation:
- Automated and manual accessibility tests.

## Milestone Invariants

1. Management APIs are authenticated by default.
2. Authorization is server-side.
3. Unknown permission denies.
4. Database rows are not API contracts.
5. Provider payloads are not canonical resources.
6. ChannelForge IDs are opaque.
7. Mutations are explicit commands.
8. Long-running work uses Background Jobs.
9. Safe retries use idempotency.
10. Mutable resources use optimistic concurrency.
11. Activated revisions remain immutable.
12. Errors do not expose stack traces.
13. Collection order is stable.
14. Public output is separately configured.
15. Streaming responses are not JSON envelopes.
16. Webhook payloads are not canonical state.
17. First-party UI uses stable contracts.
18. UI does not bypass authorization.
19. UI does not double-submit.
20. UI preserves ETags and idempotency.
21. Passwords are not plaintext or reversibly encrypted.
22. Secrets are not in ordinary tables.
23. Secrets are never logged.
24. API token values are shown once.
25. Sessions are revocable.
26. CSRF protects cookie mutations.
27. CORS denies untrusted origins.
28. Forwarded headers require trusted proxies.
29. SSRF controls apply to integrations and plugins.
30. Uploads are staged and validated.
31. Backups are sensitive.
32. Audit is append-oriented.
33. Plugins extend declared ports.
34. Plugins do not access core tables.
35. Plugins do not bypass domain validation.
36. Plugin permissions are explicit.
37. Plugin storage is namespaced.
38. Plugin secrets are scoped.
39. Plugin jobs are bounded.
40. Plugin network access is declared.
41. Plugin output validates before activation.
42. Plugin UI contributions are limited.
43. Plugin failure does not corrupt core state.
44. Disabling stops new plugin execution.
45. Uninstall preserves historical references.
46. Plugin compatibility is checked.
47. Package integrity is verified.
48. Unknown manifest fields are rejected.
49. Unsigned packages require explicit policy.
50. The plugin system is not remote code execution.
51. Legacy routes remain measured.
52. Legacy mutations freeze server-side.
53. Legacy removal requires evidence.
54. OpenAPI is checked in CI.
55. Security controls are tested.
56. Windows behavior is tested.
57. Linux is authoritative for production.
58. Docker and Unraid remain supported.
59. Tunarr attribution remains intact.
60. Build remains green.
61. Milestone 10 starts only after completion gates pass.

## Deferred Decisions

- Exact API framework conventions
- Exact OpenAPI library
- Exact 400 versus 422 policy
- Exact password-hashing parameters
- Exact API-token verifier construction
- Exact session schema and cookie name
- Exact CSRF mechanism
- Exact CORS representation
- Exact trusted-proxy representation
- Exact rate-limit storage
- Exact Secret Service library
- Exact key-storage mechanism
- Exact backup encryption
- Exact audit retention
- Exact UI data-client and state library
- Exact accessibility conformance target
- Exact plugin archive and signature format
- Exact publisher key infrastructure
- Exact isolated-process protocol
- Exact plugin language runtime
- Exact plugin resource enforcement
- Exact plugin migration representation
- Exact plugin UI contribution mechanism
- Exact plugin storage quota
- Exact plugin network allowlist syntax
- Exact support-window duration
- Exact legacy route removal release
- OIDC
- Passkeys
- MFA
- Remote plugin marketplace
- Native plugins
- Kernel-level sandbox
- Multi-tenant isolation

## Immediate Next Milestone

After this milestone is completed, proceed to:

```text
docs/implementation/10-deployment-validation-and-release.md
```

That milestone will finalize Docker and Unraid packaging, configuration,
upgrade and rollback workflows, release security, performance and scale
validation, operational documentation, compatibility evidence, release
candidates, and version 1 completion criteria.
