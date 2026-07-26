# ChannelForge API Specification

- **Specification version:** 0.1
- **Status:** Draft
- **Last updated:** 2026-07-27

## Purpose

This document defines the external and internal HTTP API conventions for
ChannelForge version 1.

It specifies:

- REST resource conventions
- API versioning
- Request and response envelopes
- Error contracts
- Authentication
- Authorization
- Idempotency
- Optimistic concurrency
- Pagination
- Filtering
- Sorting
- Searching
- Long-running operations
- Background Job resources
- Bulk operations
- File uploads and downloads
- Stream endpoints
- XMLTV, M3U, and HDHomeRun-compatible endpoints
- Webhooks
- Conditional requests
- Rate limiting
- Deprecation
- OpenAPI documentation
- Compatibility
- Security
- Testing

This document defines the contract boundary.

It does not define:

- Exact database tables
- Provider-specific adapter payloads
- FFmpeg command construction
- Internal user-interface component structure
- Deployment-specific reverse-proxy configuration
- Plugin execution internals

Those concerns are defined in other architecture specifications.

## API Mission

The ChannelForge API must expose the application as a coherent television
network management system.

The API must:

- Use ChannelForge domain language
- Preserve domain boundaries
- Avoid exposing database structure
- Avoid exposing provider-specific payloads as canonical contracts
- Make mutations explicit
- Support safe retries
- Support long-running operations
- Provide stable identifiers
- Provide actionable errors
- Enforce authorization consistently
- Remain suitable for the first-party web interface
- Remain usable by automation and future clients
- Preserve compatibility across supported releases

## Scope

Version 1 includes HTTP APIs for:

- Instance setup
- Authentication
- Users and access
- Media Sources
- Source libraries
- Catalog Items
- Source Bindings
- Playback Variants
- Catalog conflicts
- Collections
- Networks
- Channels
- Branding
- Programming configuration
- Schedule generation
- Schedule Plans
- Validation
- Approval
- Publication
- Runtime status
- Playout control
- Background Jobs
- Health
- Audit
- Backup
- Restore preparation
- Templates
- Programming Packs
- Output artifacts
- XMLTV
- M3U
- HDHomeRun-compatible discovery and lineup

Version 1 does not require:

- GraphQL
- gRPC
- Public multi-tenant SaaS APIs
- Unauthenticated administrative APIs
- Arbitrary database query APIs
- A generic remote code execution API
- Per-viewer schedule APIs
- External event streaming as a required dependency

## Core Principles

1. API resources use ChannelForge-owned identities.
2. Database row IDs are not API contracts.
3. Provider-specific IDs are qualified and scoped.
4. Mutation endpoints validate domain commands.
5. Long-running work returns a Background Job or operation resource.
6. Safe retries use idempotency keys.
7. Mutable resources use optimistic concurrency.
8. Errors are structured and stable.
9. Sensitive fields are omitted or redacted.
10. Collection endpoints use stable pagination and ordering.
11. Authorization is enforced server-side for every operation.
12. Public output endpoints are separate from management APIs.
13. Approved revisions and Schedule Plans are immutable.
14. API evolution is additive within a supported major version.
15. OpenAPI documentation is generated or validated against implementation.

## API Surface Separation

ChannelForge exposes distinct API surfaces:

1. **Management API**
2. **Runtime API**
3. **Output Artifact API**
4. **Streaming API**
5. **HDHomeRun-Compatible API**
6. **Webhook Ingress API**
7. **Health and Diagnostics API**

These surfaces may share one HTTP server but differ in:

- Authentication
- Caching
- Rate limits
- Response types
- Timeout behavior
- Exposure policy

## Base Paths

Suggested base paths:

```text
/api/v1
/stream
/xmltv
/playlist
/hdhomerun
/webhooks
/health
```

Exact paths remain implementation details until route contracts are finalized.

## Management API

The Management API is the primary first-party and automation interface.

Suggested root:

```text
/api/v1
```

It uses:

- JSON requests
- JSON responses
- Authenticated access
- Structured errors
- Optimistic concurrency
- Idempotency for retryable mutations

## Runtime API

The Runtime API exposes current operational state and control.

Examples:

- Current Channel status
- Now/next
- Active Playout Session
- Restart Channel
- Maintenance mode
- Recent Playout Attempts

Runtime controls require elevated authorization.

## Output Artifact API

The Output Artifact API serves:

- XMLTV
- M3U
- Logos
- Guide artwork
- Generated exports
- Diagnostic bundles where authorized

Artifact endpoints may use conditional caching.

## Streaming API

The Streaming API serves live Channel output.

It has different characteristics from JSON APIs:

- Long-lived responses
- Client disconnect handling
- Stream-specific authorization
- No ordinary JSON envelope
- Different timeout behavior
- Limited cacheability

## HDHomeRun-Compatible API

The HDHomeRun-compatible API exposes protocol-compatible discovery and lineup
resources.

It must not redefine canonical Channel identity.

## Webhook Ingress API

Webhook endpoints accept provider event hints.

They:

- Bound request size
- Verify source
- Deduplicate
- Queue Background Jobs
- Return quickly
- Never trust provider payloads as canonical state without verification

## Health and Diagnostics API

Health endpoints may include:

- Liveness
- Readiness
- Detailed authenticated health
- Storage health
- Source health
- Runtime health
- Build information
- Diagnostic export initiation

Public liveness must reveal minimal information.

## API Versioning

### Major Version

The Management API uses a major version in the path.

Example:

```text
/api/v1
```

A breaking contract change requires a new major version or a documented
compatibility strategy.

### Minor Evolution

Within one major version, evolution should be additive.

Allowed additive changes include:

- New optional response fields
- New endpoints
- New optional request fields
- New enumeration values where clients are required to handle unknown values
- New error detail fields
- New links
- New filter options

### Breaking Changes

Breaking changes include:

- Removing a field
- Renaming a field
- Changing field meaning
- Changing requiredness incompatibly
- Changing identifier semantics
- Changing response shape
- Changing status-code semantics
- Reusing an enumeration value
- Changing default behavior that alters existing clients materially

### Compatibility Period

When a major version is superseded:

- Announce deprecation
- Document replacement
- Provide migration guidance
- Maintain a defined support period
- Expose deprecation headers where practical
- Track usage before removal

## Media Type

Management JSON uses:

```text
application/json
```

The API may define a vendor media type later.

UTF-8 is required.

## Character Encoding

JSON text is UTF-8.

Invalid encoding produces a request error.

## URL Conventions

Paths use:

- Lowercase
- Hyphen-separated resource names where needed
- Plural nouns for collections
- Opaque resource IDs
- Nested routes only when ownership is meaningful
- No action verbs for ordinary CRUD
- Explicit command routes for domain actions

Examples:

```text
/api/v1/networks
/api/v1/networks/{networkId}
/api/v1/channels/{channelId}
/api/v1/channels/{channelId}/schedule-plans
/api/v1/schedule-plans/{planId}/approve
```

## Resource Naming

Resource names follow terminology from `01-terminology.md`.

Examples:

- `mediaSources`
- `catalogItems`
- `sourceBindings`
- `playbackVariants`
- `networks`
- `channels`
- `schedulePlans`
- `scheduleEntries`
- `schedulePublications`
- `playoutSessions`
- `backgroundJobs`

Provider-specific terms must not replace canonical resource names.

## Identifier Format

API identifiers are opaque strings.

Clients must:

- Treat IDs as case-sensitive
- Avoid parsing IDs
- Avoid deriving type from ID prefix unless explicitly documented
- Preserve IDs exactly
- Avoid assuming ordering

## Resource Representation

A resource representation should include:

- `id`
- `type` where polymorphism or generic links require it
- Domain fields
- Lifecycle state
- Version or ETag source for mutable resources
- Creation timestamp
- Update timestamp where applicable
- Links where useful

## Timestamp Format

API timestamps use ISO 8601 / RFC 3339-compatible UTC strings.

Recommended form:

```text
2026-07-27T18:42:31.123Z
```

Editorial local times and IANA time-zone identifiers are represented separately.

## Duration Format

Authoritative durations are represented as integer milliseconds unless a route
explicitly uses another typed structure.

Example:

```json
{
  "durationMs": 2520000
}
```

## Local Time Format

Recurring local schedule time may use:

```text
HH:mm:ss
```

It must be accompanied by:

- IANA time zone from Channel context
- Weekday rules
- Daylight-saving policy where relevant

## Date Format

Calendar dates use:

```text
YYYY-MM-DD
```

A date is not converted to a UTC instant without explicit time-zone context.

## Boolean Fields

Booleans use JSON `true` and `false`.

Do not encode booleans as:

- `0` or `1`
- `"true"` or `"false"`
- `"yes"` or `"no"`

## Nullable and Missing Fields

The contract distinguishes:

- Field omitted
- Field present with `null`
- Empty string
- Empty collection
- Zero
- False

Request semantics must state whether omission means:

- Preserve existing
- Use default
- Clear value
- Invalid

## Enumeration Fields

Enumeration values use stable uppercase snake case unless the API style guide
selects another convention consistently.

Example:

```text
ACTIVE
ARCHIVED
DRAFT
APPROVED
```

Clients must tolerate unknown enumeration values in read responses where the
contract declares forward compatibility.

## Money

Version 1 does not require a general money model.

Any future monetary value must include:

- Integer minor units or exact decimal string
- Currency code
- No floating-point currency values

## JSON Object Conventions

JSON field names use lower camel case.

Example:

```json
{
  "channelId": "chn_...",
  "displayName": "Night Signal",
  "timeZone": "America/Los_Angeles"
}
```

## Collection Response

A standard collection response includes:

```json
{
  "items": [],
  "page": {
    "nextCursor": null,
    "previousCursor": null,
    "limit": 50,
    "hasMore": false
  }
}
```

Optional metadata may include:

- Total count
- Filter summary
- Sort summary
- Projection timestamp

Total count is omitted when expensive or unstable.

## Single Resource Response

A single resource is returned directly or through a consistent data envelope.

Version 1 should avoid unnecessary double wrapping.

Recommended:

```json
{
  "id": "chn_...",
  "displayName": "Night Signal"
}
```

## Response Metadata

Cross-cutting response metadata belongs primarily in headers.

Examples:

- Request ID
- ETag
- Last-Modified
- Rate-limit state
- Deprecation state

## Standard Headers

Suggested request and response headers:

- `Authorization`
- `Content-Type`
- `Accept`
- `Idempotency-Key`
- `If-Match`
- `If-None-Match`
- `If-Modified-Since`
- `X-Request-Id`
- `Retry-After`
- `ETag`
- `Last-Modified`
- `Location`

Exact custom-header naming may be finalized during implementation.

## Request ID

Every request receives a Request ID.

Behavior:

- Accept a valid client-supplied request ID where policy permits.
- Generate one otherwise.
- Return it in the response.
- Include it in logs and errors.
- Avoid trusting it as authorization data.
- Bound its length and character set.

## Correlation ID

A Request ID identifies one HTTP request.

A Correlation ID may connect multiple internal operations or Background Jobs.

The response may expose both where useful.

## Authentication

Management API authentication may support:

- Browser session
- API token
- Setup token during initial bootstrap
- Reverse-proxy identity in an explicitly configured mode

Version 1 should not rely on provider credentials for ChannelForge
authentication.

## Browser Session Authentication

A browser session should use:

- Secure cookie where TLS is used
- HttpOnly
- SameSite policy
- Session expiration
- Revocation
- CSRF protection where required
- Server-side session state or safely signed token policy

## API Token Authentication

API tokens are sent through the `Authorization` header.

The full token is displayed only at creation.

Stored state includes only a secure hash and identifying prefix.

## Token Scope

API token scopes may include:

- Read catalog
- Manage catalog
- Read Networks
- Manage Networks
- Generate schedules
- Approve schedules
- Publish schedules
- Read runtime
- Control runtime
- Manage sources
- Manage backups
- Read audit
- Administrator

Scopes must be checked in addition to token validity.

## Setup Authentication

Before initial setup completes, a restricted setup flow may use:

- One-time setup secret
- Local-console confirmation
- Environment bootstrap token
- Localhost-only access

Setup authentication must be disabled after initialization.

## Reverse-Proxy Authentication

Reverse-proxy authentication is optional.

It requires:

- Trusted proxy addresses
- Explicit header mapping
- Header stripping at the edge
- Fallback behavior
- Audit
- Protection against direct bypass

## Authentication Errors

Authentication failures return a stable error without revealing:

- Whether a username exists
- Token hash details
- Credential storage state
- Provider credentials
- Internal stack traces

## Authorization

Authorization evaluates:

- Authenticated actor
- Role
- Permission
- Token scope
- Resource state
- Command
- Optional ownership or instance policy

Authorization is enforced inside application services as well as route guards.

## Roles

Suggested built-in roles:

- `ADMINISTRATOR`
- `PROGRAM_DIRECTOR`
- `OPERATOR`
- `VIEWER`
- `READ_ONLY`

Exact permissions are defined in the security specification.

## Permission Checks

Each route contract declares required permission.

Examples:

- Read Catalog
- Manage Media Sources
- Edit Network
- Generate Schedule
- Approve Schedule
- Publish Schedule
- Control Playout
- Manage Backups
- Read Audit

## Resource State Authorization

Some operations depend on state.

Examples:

- Draft revision can be edited.
- Approved revision cannot be edited.
- Draft plan can be rejected.
- Only validated plan can be approved.
- Published plan cannot be deleted.
- Active Playout Session control requires runtime permission.

## CSRF Protection

Cookie-authenticated mutation requests require CSRF protection according to the
selected browser security design.

Bearer-token requests do not use cookie CSRF semantics.

## CORS

Management API CORS is disabled or restricted by default.

Allowed origins are explicit.

Credentials are never allowed with wildcard origins.

## Request Validation

Validation occurs in layers:

1. HTTP framing
2. Content type
3. JSON parsing
4. Schema validation
5. Authorization
6. Domain validation
7. Concurrency validation
8. Persistence constraints

## Schema Validation

Schema validation checks:

- Required fields
- Types
- Lengths
- Ranges
- Formats
- Enumeration values
- Collection limits
- Unknown-field policy

## Unknown Request Fields

Recommended default:

- Reject unknown fields for mutation requests where typos are dangerous.
- Allow documented extension objects where forward compatibility is required.

The policy must be consistent and reflected in OpenAPI.

## Field Length Limits

Every text field has a documented maximum length.

Examples include:

- Display name
- Description
- Tag
- URL
- Reason
- Audit note
- Search query

Oversized input is rejected before expensive processing.

## Collection Limits

Request arrays have explicit maximum sizes.

Bulk APIs use bounded batches.

## URL Validation

URL fields require:

- Supported scheme
- Host validation
- No embedded credentials
- Length limit
- Provider-specific safety checks
- SSRF policy where server-side requests result

## File Upload Validation

Uploads require:

- Maximum size
- MIME allowlist
- File signature validation
- Image dimension limits where applicable
- Checksum
- Temporary storage
- Malware or content scan policy where applicable
- Safe filename handling

Original filenames are metadata, not storage paths.

## Error Contract

Errors use a consistent JSON object.

Recommended structure:

```json
{
  "error": {
    "code": "CONCURRENCY_CONFLICT",
    "message": "The Channel changed after it was loaded.",
    "status": 409,
    "requestId": "req_...",
    "details": {
      "resourceId": "chn_...",
      "expectedVersion": 4,
      "currentVersion": 5
    },
    "violations": []
  }
}
```

## Error Fields

Required:

- Stable error code
- Human-readable message
- HTTP status
- Request ID

Optional:

- Details
- Violations
- Retry information
- Documentation reference
- Correlation ID
- Background Job ID

## Error Code Stability

Error codes are API contracts.

They must not be reused with different meaning.

## Validation Violations

Validation errors may include:

```json
{
  "field": "timeZone",
  "code": "INVALID_TIME_ZONE",
  "message": "Use a valid IANA time-zone identifier.",
  "value": "PST"
}
```

Sensitive values are omitted or redacted.

## Multiple Violations

A request may return multiple independent schema violations.

Domain validation may stop after a blocking invariant.

## Error Detail Safety

Error details must not expose:

- Stack traces
- SQL
- Filesystem secrets
- Source tokens
- Cookies
- Password state
- Signed provider URLs
- Internal network topology beyond authorized diagnostics

## HTTP Status Semantics

Suggested status use:

- `200 OK`: successful read or command with immediate representation
- `201 Created`: new resource created
- `202 Accepted`: asynchronous operation accepted
- `204 No Content`: successful command with no body
- `304 Not Modified`: conditional read
- `400 Bad Request`: malformed or invalid request
- `401 Unauthorized`: authentication required or invalid
- `403 Forbidden`: authenticated but not permitted
- `404 Not Found`: resource absent or intentionally concealed
- `405 Method Not Allowed`: unsupported method
- `409 Conflict`: state, uniqueness, or concurrency conflict
- `412 Precondition Failed`: ETag or expected-state condition failed
- `413 Content Too Large`: request or upload exceeds limit
- `415 Unsupported Media Type`: unsupported content type
- `422 Unprocessable Content`: syntactically valid but domain-invalid command
- `429 Too Many Requests`: rate limit or bounded capacity
- `500 Internal Server Error`: unexpected failure
- `503 Service Unavailable`: dependency, maintenance, or capacity state
- `504 Gateway Timeout`: upstream operation timed out where applicable

Exact distinction between 400 and 422 must remain consistent.

## Not Found Versus Forbidden

For sensitive resources, the API may return `404` instead of revealing that the
resource exists.

This policy must be applied consistently.

## Conflict Types

Conflict errors may include:

- Optimistic concurrency conflict
- Duplicate Channel number
- Duplicate source identity
- Revision already approved
- Plan already published
- Active Background Job exists
- Provider identity mismatch
- Resource state conflict

## Retryable Errors

Retryable errors include explicit metadata.

Example:

```json
{
  "retryable": true,
  "retryAfterSeconds": 15
}
```

Clients must not retry non-idempotent requests without an Idempotency Key.

## Idempotency

### Idempotency Header

Retryable create or command endpoints may accept:

```text
Idempotency-Key
```

### Idempotency Scope

An Idempotency Key is scoped by:

- Authenticated actor or token
- Route or command type
- Target resource where applicable
- Instance
- Retention window

### Idempotency Behavior

The server stores:

- Key hash or normalized key
- Request fingerprint
- Initial timestamp
- Result status
- Result resource or Background Job
- Expiration

### Same Key, Same Request

A repeated request with the same key and same fingerprint returns the original
result or current operation state.

### Same Key, Different Request

A repeated key with a different fingerprint returns a conflict.

### Idempotency Retention

Retention is long enough for expected client retry windows.

The exact duration is configurable.

## Optimistic Concurrency

Mutable resource updates require a version precondition.

Preferred mechanisms:

- `If-Match` with ETag
- Explicit `expectedVersion` for command APIs
- Both where clarity requires it

## ETag

Mutable resource responses include an ETag derived from:

- Resource ID
- Version
- Representation variant where required

ETags must not leak secrets.

## If-Match

Update or delete commands may require:

```text
If-Match: "resource-version"
```

Missing required precondition may return a precondition-required error.

## Concurrency Failure

When the version changed:

- Do not apply partial mutation.
- Return current version or ETag where safe.
- Provide conflict code.
- Allow client reload and comparison.

## Immutable Resources

Immutable resources may use ETag for caching but do not require mutation
preconditions because mutation is not allowed.

## Conditional Reads

Read endpoints may support:

- `If-None-Match`
- `If-Modified-Since`

A matching condition returns `304` without a body.

## Create Resource Convention

Create endpoints use:

```text
POST /resources
```

On success:

- Return `201`
- Return resource representation
- Include `Location`
- Include ETag if mutable

## Replace Convention

Full replacement may use:

```text
PUT /resources/{id}
```

Version 1 should use PUT sparingly because many domain resources are not safely
replaceable as whole documents.

## Partial Update Convention

Partial updates may use:

```text
PATCH /resources/{id}
```

The API must choose and document one patch format.

For domain-heavy mutations, explicit command routes are preferred.

## Delete Convention

Deletion uses:

```text
DELETE /resources/{id}
```

Most ChannelForge entities archive rather than hard-delete.

The route contract must state whether DELETE means:

- Archive
- Revoke
- Remove child relationship
- Hard delete

Hard deletion should require an explicit administrative command.

## Archive Command

Explicit archive may use:

```text
POST /resources/{id}/archive
```

This is clearer where DELETE semantics would be misleading.

## Restore Command

Restore from archive may use:

```text
POST /resources/{id}/restore
```

## Domain Command Routes

Domain actions use explicit subresources or commands.

Examples:

```text
POST /schedule-plans/{planId}/validate
POST /schedule-plans/{planId}/approve
POST /schedule-plans/{planId}/reject
POST /channels/{channelId}/publish
POST /channels/{channelId}/restart
POST /media-sources/{mediaSourceId}/synchronize
```

## Command Response

An immediate command may return:

- Updated resource
- Command result
- `204`

A long-running command returns:

- `202`
- Background Job representation
- `Location` to job
- Optional target resource link

## Safe Methods

GET and HEAD must not perform domain mutations.

A cache refresh or health observation caused incidentally by GET must not alter
editorial state.

## Search

Search may use:

```text
GET /catalog-items?search=...
```

Search behavior must define:

- Normalization
- Fields searched
- Ranking
- Maximum query length
- Stable tie-break
- Archived inclusion
- Availability filters

## Filtering

Filters use query parameters.

Examples:

```text
?mediaKind=MOVIE
?availability=AVAILABLE
?networkId=net_...
?state=DRAFT
```

Repeated fields or comma-separated values must follow one consistent convention.

## Filter Operators

Version 1 should use a bounded documented set.

Potential operators:

- Equal
- Not equal
- Greater than
- Greater than or equal
- Less than
- Less than or equal
- In
- Contains
- Exists
- Date range

Avoid exposing arbitrary SQL-like expressions.

## Nested Filters

Complex selector authoring may use typed JSON command bodies rather than
unbounded query-string expressions.

## Sorting

Sort may use:

```text
?sort=displayName
?sort=-createdAt
```

A leading minus may indicate descending order.

Every sort includes a stable final ID tie-break.

## Default Sorting

Every collection endpoint declares a deterministic default sort.

## Unsupported Sort

Unsupported sort fields return a validation error.

## Pagination

Cursor-based pagination is preferred for large mutable collections.

## Cursor Properties

A cursor must be:

- Opaque
- Signed or integrity-protected where needed
- Bound to filter and sort
- Bounded in size
- Expiring only when documented
- Safe to log only if it contains no secrets

## Cursor Request

Example:

```text
?limit=50&cursor=...
```

## Page Limit

Each endpoint defines:

- Default limit
- Maximum limit

Requests above maximum are rejected or clamped according to documented policy.

Rejecting is clearer for automation.

## Total Counts

Total counts may be omitted for expensive queries.

When provided, the response states whether count is exact or estimated.

## Stable Pagination

Pagination must not depend on unspecified database order.

## Offset Pagination

Offset pagination may be used for:

- Small administrative lists
- Static snapshots
- Audit export pages

It should not be the default for large mutable catalogs.

## Field Selection

Version 1 may support limited field expansion rather than arbitrary sparse
fieldsets.

## Expansion

Example:

```text
?include=sourceBindings,playbackVariants
```

Expansion must be bounded to avoid enormous responses.

## Default Representation

Default list representations should be summaries.

Detailed child collections use dedicated routes or explicit inclusion.

## Maximum Response Size

Endpoints must bound response size through:

- Pagination
- Expansion limits
- Field limits
- Streaming export
- Compression where appropriate

## Compression

JSON and artifact responses may use HTTP compression.

Live MPEG-TS and already-compressed media should not be recompressed by the web
server.

## Long-Running Operations

Long-running work returns a Background Job.

Examples:

- Full synchronization
- Schedule generation
- Artifact generation
- Backup
- Restore preparation
- Projection rebuild
- Integrity check
- Large import
- Diagnostic export

## Background Job Resource

Suggested representation:

```json
{
  "id": "job_...",
  "jobType": "GENERATE_SCHEDULE",
  "state": "RUNNING",
  "progress": {
    "current": 420,
    "total": 1000,
    "unit": "entries"
  },
  "requestedAt": "2026-07-27T18:42:31.123Z",
  "startedAt": "2026-07-27T18:42:32.001Z",
  "completedAt": null,
  "result": null,
  "error": null
}
```

## Job Polling

Clients may poll:

```text
GET /background-jobs/{jobId}
```

Polling guidance may be included through:

- Retry-After
- Progress state
- Suggested poll interval

## Job Cancellation

Cancellation may use:

```text
POST /background-jobs/{jobId}/cancel
```

Cancellation is a request, not guaranteed immediate termination.

## Job Result

On success, `result` may contain links to:

- Schedule Plan
- Synchronization Run
- Backup
- Artifact
- Diagnostic bundle

Large results are not embedded in the job representation.

## Job Failure

A failed job contains structured error data and diagnostic link where
authorized.

## Job Events

Version 1 may optionally expose Server-Sent Events for Background Job updates.

Polling remains the required baseline.

## Server-Sent Events

Potential use:

- Job progress
- Runtime state
- Source synchronization status
- Health changes

SSE is deferred unless implementation cost is justified.

## WebSocket

WebSocket is not required for version 1.

## Bulk Operations

Bulk operations are explicit and bounded.

Examples:

- Apply label to Catalog Items
- Archive multiple Catalog Items
- Validate multiple Plans
- Delete multiple stale jobs
- Reorder Channel list

## Bulk Request

A bulk request includes:

- Item IDs
- Command parameters
- Atomicity mode
- Idempotency Key where applicable

## Bulk Atomicity Modes

Suggested modes:

- `ALL_OR_NOTHING`
- `BEST_EFFORT`

The endpoint declares supported modes.

## Bulk Response

Best-effort response includes per-item results.

Example:

```json
{
  "results": [
    {
      "id": "cat_1",
      "status": "SUCCEEDED"
    },
    {
      "id": "cat_2",
      "status": "FAILED",
      "error": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

## Bulk Limits

Every bulk endpoint has a maximum item count.

Large work becomes a Background Job.

## File Uploads

Uploads may use:

- Multipart form data
- Preflight resource followed by upload
- Direct managed upload endpoint

Version 1 should prefer a simple bounded multipart flow for local deployments.

## Upload Lifecycle

Suggested flow:

1. Authorize.
2. Validate request metadata.
3. Stream to temporary storage.
4. Enforce size limit.
5. Validate file signature.
6. Calculate checksum.
7. Validate dimensions or media metadata.
8. Move to managed storage.
9. Create resource.
10. Return representation.

## Upload Error Cleanup

Failed uploads must remove temporary files.

## File Downloads

Downloads should:

- Authorize
- Set safe content type
- Set safe filename
- Support conditional requests where useful
- Avoid path exposure
- Stream without loading entire file into memory
- Record audit for sensitive downloads

## Content-Disposition

User-downloadable files may use attachment disposition.

Filenames are sanitized.

## Range Requests for Files

Static artifacts may support byte ranges where useful.

Live Channel streams follow stream-specific behavior.

## Import APIs

Imports should use:

1. Upload or source selection.
2. Parse and validate.
3. Produce preview.
4. Resolve conflicts.
5. Apply through Background Job.
6. Return result report.

Imports must not apply destructive changes without explicit confirmation.

## Export APIs

Exports may be synchronous when small or asynchronous when large.

Exports include a schema version.

## OpenAPI

The Management API must have an OpenAPI description.

The description includes:

- Routes
- Methods
- Parameters
- Request schemas
- Response schemas
- Error schemas
- Authentication
- Permissions where possible
- Examples
- Deprecation
- Enumeration values

## OpenAPI Source of Truth

The implementation must choose one approach:

- Code-first generation
- Contract-first generation
- Hybrid with validation

Drift between runtime and specification must fail CI.

## Schema Reuse

Common schemas include:

- Error
- Validation violation
- Page
- Link
- Background Job
- Audit metadata
- Timestamp
- Duration
- Resource version

## OpenAPI Security

Examples must not contain real credentials or internal URLs.

## API Documentation

Documentation should include:

- Getting started
- Authentication
- Common workflows
- Error handling
- Pagination
- Idempotency
- Concurrency
- Webhooks
- Output endpoints
- Deprecation

## Client Generation

OpenAPI may support generated clients.

Generated clients are secondary to contract clarity.

The API must not contort domain semantics solely for one generator.

## Resource Links

Representations may include links.

Example:

```json
{
  "links": {
    "self": "/api/v1/channels/chn_...",
    "network": "/api/v1/networks/net_...",
    "schedulePlans": "/api/v1/channels/chn_.../schedule-plans"
  }
}
```

Links are additive and optional for clients.

## Instance Endpoints

Suggested operations:

- Read instance information
- Read setup status
- Complete setup
- Read build information
- Read instance settings
- Update mutable settings
- Read feature flags
- Read supported capabilities

Sensitive build and environment details require authentication.

## Authentication Endpoints

Suggested operations:

- Sign in
- Sign out
- Read current session
- Refresh session
- Change password
- Create API token
- List API tokens
- Revoke API token

## User Endpoints

Suggested operations:

- List users
- Create user
- Read user
- Update user
- Disable user
- Archive user
- Assign roles
- Read permissions

## Media Source Endpoints

Suggested operations:

- List Media Sources
- Create Media Source
- Read Media Source
- Update Media Source
- Test connection
- Discover capabilities
- Discover libraries
- Set library inclusion
- Synchronize
- Read synchronization runs
- Read health
- Manage Path Mappings
- Rotate credential
- Disable
- Archive
- Restore

## Media Source Secrets

Create or rotate responses never return stored secret values.

A response may return:

- Credential configured state
- Credential type
- Last rotated timestamp
- Last verified timestamp

## Catalog Endpoints

Suggested operations:

- Search Catalog Items
- Read Catalog Item
- Read Source Bindings
- Read Playback Variants
- Read metadata provenance
- Set user override
- Remove override
- Archive item
- Restore item
- Create manual item
- Read hierarchy
- Manage collections
- Manage labels
- Read conflicts
- Resolve conflict
- Merge items
- Split item
- Create Catalog Snapshot

## Catalog Item Summary

List responses should include enough information for programming selection:

- ID
- Media kind
- Title
- Series context
- Year
- Duration
- Availability
- Artwork summary
- Source count
- Conflict state

## Source Binding Representation

A Source Binding representation may expose:

- Provider type
- Media Source ID
- External item ID
- Library
- State
- Last seen
- Match state
- Availability

It must not expose provider credentials or signed access URLs.

## Playback Variant Representation

A Playback Variant representation may expose technical metadata but not
restricted runtime access descriptors.

## Conflict Resolution Commands

Conflict resolution commands require:

- Expected conflict version
- Resolution type
- Target IDs
- Operator note where required
- Preview where destructive

## Network Endpoints

Suggested operations:

- List Networks
- Create Network
- Read Network
- Update mutable identity
- Archive Network
- Restore Network
- Read profile revisions
- Create draft profile revision
- Update draft
- Validate revision
- Approve revision
- Activate revision
- Read Channels
- Manage branding

## Channel Endpoints

Suggested operations:

- List Channels
- Create Channel
- Read Channel
- Update mutable identity
- Archive Channel
- Restore Channel
- Read programming revisions
- Create programming draft
- Update programming draft
- Validate programming revision
- Approve programming revision
- Activate programming revision
- Read schedule status
- Generate schedule
- Read current publication
- Read runtime status
- Enter maintenance
- Restart runtime

## Revision Endpoints

Revision routes should preserve immutability.

Example:

```text
POST /channels/{channelId}/programming-revisions
PATCH /programming-revisions/{revisionId}
POST /programming-revisions/{revisionId}/validate
POST /programming-revisions/{revisionId}/approve
POST /channels/{channelId}/activate-programming-revision
```

Approved revisions do not accept PATCH.

## Schedule Generation Endpoint

A schedule generation request may include:

- Horizon
- Mode
- Configuration revision
- Existing plan
- Regeneration range
- Seed
- Approval policy
- Diagnostic verbosity
- Idempotency Key

The endpoint returns a Background Job.

## Schedule Plan Endpoints

Suggested operations:

- List Schedule Plans
- Read Schedule Plan
- Read timeline
- Read entries
- Read metrics
- Read validation
- Validate plan
- Approve plan
- Reject plan
- Compare plans
- Read generation explanation
- Regenerate range
- Lock entry
- Unlock entry

## Schedule Entry Pagination

Timeline reads may paginate by time range rather than generic cursor.

Parameters may include:

- `start`
- `end`
- `limit`
- `cursor`

The result remains ordered by start and sequence.

## Schedule Plan Approval

Approval requires:

- `If-Match` or expected plan state
- Validation Result ID
- Warning acknowledgments
- Optional note
- Permission

Approval is idempotent only with an Idempotency Key.

## Publication Endpoints

Suggested operations:

- Read active publication
- List publication history
- Publish approved Plan
- Schedule future publication
- Roll back to prior publication
- Read artifact status
- Regenerate artifacts

## Publish Command

A publish request includes:

- Approved Plan ID
- Effective time
- Handoff policy
- Expected current publication
- Artifact policy
- Idempotency Key

## Runtime Endpoints

Suggested operations:

- Read Channel runtime status
- Read now/next
- Read active Playout Session
- Read recent Playout Decisions
- Read recent attempts
- Read Airing Records
- Start session
- Stop session
- Restart session
- Force source reselection
- Enter maintenance
- Exit maintenance

## Runtime Command Safety

Runtime commands must distinguish:

- Editorial changes
- Operational recovery
- Diagnostic test

A runtime restart must not mutate the Schedule Plan.

## Background Job Endpoints

Suggested operations:

- List jobs
- Read job
- Cancel job
- Retry eligible failed job
- Read job logs
- Read job result
- Archive old job

## Audit Endpoints

Suggested operations:

- Search audit
- Read Audit Record
- Export audit report

Audit search supports:

- Actor
- Action
- Target
- Time range
- Outcome
- Correlation ID

Audit details require elevated permission.

## Health Endpoints

### Liveness

Liveness indicates whether the process can respond.

It should not perform expensive dependency checks.

### Readiness

Readiness indicates whether the instance can serve normal management traffic.

It may consider:

- Database
- Migrations
- Storage
- Startup reconciliation
- Critical configuration

### Detailed Health

Authenticated detailed health may include:

- Database
- Managed storage
- Media Sources
- Artifact freshness
- Job queue
- Playout
- Clock
- Backup freshness

## Backup Endpoints

Suggested operations:

- List backups
- Start backup
- Read backup
- Verify backup
- Download backup
- Delete backup
- Prepare restore
- Confirm restore
- Read restore status

Restore requires a multi-step confirmation flow.

## Restore Confirmation

Restore should require:

- Backup verification
- Explicit confirmation token
- Current administrator authentication
- Maintenance acknowledgment
- Optional typed instance name
- Idempotency Key

## Template Endpoints

Suggested operations:

- List Templates
- Create Template
- Read Template
- Create revision
- Update draft revision
- Validate
- Approve
- Apply to Network or Channel
- Archive

## Programming Pack Endpoints

Suggested operations:

- List installed Packs
- Import Pack
- Preview Pack
- Read Pack
- Apply Pack
- Update Pack
- Disable Pack
- Uninstall Pack where safe

Pack import is treated as untrusted data.

## Output Artifact Endpoints

Suggested routes:

```text
/xmltv/{instanceOrProfile}.xml
/playlist/{instanceOrProfile}.m3u
/api/v1/output-artifacts/{artifactId}
/api/v1/channels/{channelId}/logo
```

Exact public aliases are configurable.

## XMLTV Endpoint

The XMLTV endpoint:

- Serves last valid active artifact
- Uses correct content type
- Supports ETag
- Supports Last-Modified
- May require access token
- Does not generate synchronously on every request
- Returns controlled error when no valid artifact exists

## M3U Endpoint

The M3U endpoint:

- Serves last valid playlist
- Uses correct content type
- Uses configured public base URL
- Does not expose provider tokens
- May embed ChannelForge stream access tokens according to policy
- Supports ETag

## Logo Endpoint

Logo responses:

- Use managed or proxied artwork
- Hide provider credentials
- Validate MIME type
- Support caching
- Use stable Channel identity

## Streaming Endpoint

Suggested route:

```text
/stream/channels/{channelId}
```

Possible protocol variants may use:

```text
/stream/channels/{channelId}.ts
/stream/channels/{channelId}/index.m3u8
```

Exact route design is implementation-specific.

## Stream Authentication

Stream authentication may use:

- Browser session
- API token
- Signed stream token
- Local-network policy
- Reverse-proxy authentication

## Stream Errors

Before output starts, the endpoint may return an HTTP error.

After output starts, failures are represented through stream termination,
recovery content, or protocol-specific behavior.

A JSON error body must not be inserted into a media stream.

## Stream Response Headers

Headers may include:

- Content type
- Cache control
- Connection behavior
- Request ID
- Optional Channel identity
- CORS policy

## HDHomeRun-Compatible Endpoints

Potential endpoints include:

- Discovery document
- Device description
- Lineup
- Lineup status
- Channel stream URLs

These endpoints follow expected compatibility shapes rather than the standard
Management API error envelope where protocol compatibility requires it.

## Protocol Compatibility Boundary

HDHomeRun-compatible shapes must be isolated from canonical domain models.

## Webhook Endpoints

Suggested route:

```text
/webhooks/media-sources/{mediaSourceId}/{provider}
```

Webhook endpoints:

- Use provider-specific verification
- Return quickly
- Queue targeted synchronization
- Deduplicate
- Apply rate limits
- Never expose management resources

## Webhook Response

A valid accepted webhook usually returns:

- `202 Accepted`, or
- Provider-required success response

Invalid authentication returns a provider-compatible error without excess
detail.

## Outbound Webhooks

Future outbound webhooks may notify external systems.

Version 1 may defer outbound webhooks.

## Rate Limiting

Rate limiting protects:

- Authentication
- Setup
- Expensive searches
- Synchronization commands
- Backup commands
- Diagnostics
- Streaming token creation
- Webhook ingress

## Rate Limit Dimensions

Limits may apply by:

- IP classification
- User
- API token
- Route
- Resource
- Media Source
- Instance

## Rate Limit Response

A limited request returns:

- `429`
- Stable error code
- `Retry-After` where known
- Request ID

## Capacity Limits

Resource exhaustion may return `503` rather than `429`.

Example:

- No transcode capacity
- Database maintenance
- Restore in progress
- Instance shutting down

## Abuse Protection

Controls include:

- Request body limits
- Header limits
- Query length limits
- Pagination limits
- Bulk limits
- Upload limits
- Authentication throttling
- Webhook limits
- Background Job deduplication
- Stream session limits

## Timeouts

Management requests have bounded timeouts.

Long work becomes a Background Job.

Stream responses use stream-specific timeout policy.

## Cancellation on Disconnect

For ordinary reads, server work may be cancelled when the client disconnects.

For accepted Background Jobs, client disconnect does not cancel the job.

## Maintenance Mode

During maintenance or restore:

- Liveness remains available.
- Readiness may fail.
- Management writes return controlled `503`.
- Existing artifacts may remain available.
- Streaming behavior follows maintenance policy.
- Restore endpoints remain restricted.

## Deprecation

Deprecated routes or fields are:

- Marked in OpenAPI
- Documented
- Logged for usage
- Given replacement
- Assigned removal target
- Not silently removed

## Deprecation Headers

Responses may include:

- Deprecation indicator
- Sunset date
- Documentation link

Exact header names follow implementation standards.

## Compatibility Aliases

Temporary aliases may preserve inherited Tunarr endpoints.

Compatibility aliases must:

- Be isolated
- Be documented
- Use translation adapters
- Avoid becoming canonical
- Emit deprecation metadata
- Have removal criteria

## Tunarr API Compatibility

Inherited Tunarr API routes may remain operational during migration.

New ChannelForge UI and services should target ChannelForge v1 routes.

Compatibility behavior must not leak legacy database shapes into new contracts.

## Legacy Identifier Resolution

Compatibility routes may accept legacy IDs and resolve them through mapping.

Canonical responses use ChannelForge IDs.

## API Gateway Boundary

Version 1 does not require a separate API gateway.

The application server may provide:

- Routing
- Authentication
- Rate limiting
- Request IDs
- Compression
- CORS
- OpenAPI

A reverse proxy may provide TLS and connection management.

## Reverse Proxy Headers

Forwarded headers are trusted only from configured proxy addresses.

The application must prevent host-header and scheme spoofing.

## Public URL Construction

Public links derive from:

1. Explicit configured public base URL
2. Trusted reverse-proxy headers
3. Safe request origin
4. Local fallback

## Security Headers

Management responses should use appropriate headers for:

- Content type
- Clickjacking protection
- MIME sniffing protection
- Referrer policy
- Content Security Policy for HTML surfaces
- HSTS where TLS termination and deployment policy permit

## Cache Policy

### Management Resources

Authenticated management responses are generally private or no-store where
sensitive.

### Immutable Resources

Approved Plans, revision snapshots, and artifacts may use ETag and longer
private caching.

### Public Artifacts

XMLTV, M3U, and logos may use conditional caching according to access policy.

### Stream Responses

Live streams generally prevent intermediary caching.

## Sensitive Response Fields

Sensitive fields include:

- Credential values
- Token hashes
- Signed source URLs
- Cookies
- Secret headers
- Local paths where restricted
- Password state details
- Encryption keys
- Raw provider payloads

They are omitted or redacted.

## Administrative Diagnostics

Detailed diagnostics may expose:

- Redacted FFmpeg command
- Source failure
- Provider response metadata
- Database health
- Job traces

Diagnostics require permission and are audited.

## Logging

Request logs should include:

- Request ID
- Actor ID
- Token ID prefix where appropriate
- Route template
- Method
- Status
- Duration
- Response size
- Error code
- Correlation ID
- Client address classification

Logs should not include:

- Authorization header
- Cookies
- Request bodies by default
- Signed URLs
- Secrets
- Uploaded binary content

## Metrics

Suggested API metrics:

- Request count
- Status count
- Latency
- Active requests
- Request size
- Response size
- Authentication failures
- Authorization failures
- Validation failures
- Concurrency conflicts
- Idempotency replays
- Rate-limit events
- Background Job acceptance
- Stream connections
- Webhook receipts

## Tracing

Potential spans:

- Authenticate
- Authorize
- Validate request
- Load aggregate
- Execute command
- Persist transaction
- Queue Background Job
- Serialize response
- Resolve stream session
- Serve artifact

## Privacy

API logs and audit must minimize personal data.

Remote addresses may be:

- Truncated
- Classified
- Retained for bounded periods
- Restricted to security diagnostics

## Localization

Version 1 API error codes are language-neutral.

Human-readable messages may initially be English.

Clients should rely on error codes, not message text.

## Date and Time Localization

The API returns canonical UTC timestamps and explicit time-zone identifiers.

Formatting for local display is a client concern.

## API Test Strategy

### Contract Tests

Every route requires tests for:

- Authentication
- Authorization
- Valid request
- Invalid request
- Not found
- Conflict
- Concurrency
- Idempotency
- Response schema
- Error schema
- Request ID
- Sensitive field omission

### OpenAPI Tests

Tests should verify:

- Every implemented Management route appears in OpenAPI.
- Every documented route exists.
- Request schemas match runtime validation.
- Response schemas match runtime output.
- Error responses use common schema.
- Security declarations match runtime.
- Deprecated routes are marked.
- Examples validate.

### Authentication Tests

Tests should cover:

- Valid session
- Expired session
- Revoked session
- Valid API token
- Expired API token
- Revoked API token
- Missing scope
- Setup token lifecycle
- Reverse-proxy spoof attempt
- CSRF failure

### Authorization Tests

Tests should cover every permission boundary.

A route must not rely only on hidden UI controls.

### Validation Tests

Tests should cover:

- Missing field
- Unknown field
- Wrong type
- Oversized string
- Invalid enumeration
- Invalid timestamp
- Invalid time zone
- Invalid URL
- Excessive array
- Malformed JSON
- Unsupported media type

### Idempotency Tests

Tests should cover:

- Same key and request
- Same key and different request
- Concurrent duplicate requests
- Job creation replay
- Expired key
- Actor scope
- Failure replay policy

### Concurrency Tests

Tests should cover:

- Correct ETag
- Stale ETag
- Missing required If-Match
- Concurrent update
- Archive conflict
- Approval race
- Publication race

### Pagination Tests

Tests should cover:

- First page
- Next page
- Stable ordering
- Filter-bound cursor
- Sort-bound cursor
- Invalid cursor
- Maximum limit
- Mutation between pages
- Archived inclusion

### Error Tests

Tests should verify:

- Stable code
- Correct status
- Request ID
- No stack trace
- No secrets
- Validation violations
- Retry metadata
- Conflict details

### Upload Tests

Tests should cover:

- Valid image
- Oversized image
- Wrong MIME
- Wrong file signature
- Path-like filename
- Interrupted upload
- Duplicate checksum
- Temporary cleanup
- Unauthorized upload

### Stream Endpoint Tests

Tests should cover:

- Authorization
- First client
- Shared client
- Late join
- Client disconnect
- No publication
- No source
- Recovery
- Correct content type
- No JSON after stream start
- Token expiration behavior

### Artifact Endpoint Tests

Tests should cover:

- Valid XMLTV
- Valid M3U
- ETag
- 304
- Missing artifact
- Prior valid artifact
- Authenticated and public policy
- Logo caching
- Public base URL

### HDHomeRun Compatibility Tests

Tests should validate expected:

- Discovery shape
- Device identity
- Lineup shape
- Channel URLs
- Tuner limits
- Error behavior
- Stable Channel identity

### Webhook Tests

Tests should cover:

- Valid signature
- Invalid signature
- Replay
- Duplicate event
- Oversized payload
- Unknown source
- Rate limit
- Fast acceptance
- Background Job enqueue
- No direct catalog mutation

### Performance Tests

Performance tests should measure:

- Catalog list
- Catalog search
- Schedule timeline
- Background Job polling
- XMLTV download
- M3U download
- Concurrent runtime status
- Stream attachment
- Authentication throughput
- Large audit query
- OpenAPI generation

## Reference Create Channel Request

```http
POST /api/v1/channels
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: 8fd763c8-9f2d-46cb-9c59-64756d2bbf93
```

```json
{
  "networkId": "net_...",
  "displayName": "Night Signal",
  "channelNumber": {
    "major": 107,
    "minor": null
  },
  "timeZone": "America/Los_Angeles"
}
```

Successful response:

```http
201 Created
Location: /api/v1/channels/chn_...
ETag: "chn-1"
```

## Reference Concurrency Failure

Request:

```http
PATCH /api/v1/channels/chn_...
If-Match: "chn-4"
Content-Type: application/json
```

Current server version is 5.

Response:

```http
412 Precondition Failed
```

```json
{
  "error": {
    "code": "PRECONDITION_FAILED",
    "message": "The Channel changed after it was loaded.",
    "status": 412,
    "requestId": "req_...",
    "details": {
      "currentEtag": "\"chn-5\""
    },
    "violations": []
  }
}
```

## Reference Schedule Generation

Request:

```http
POST /api/v1/channels/chn_.../schedule-generations
Authorization: Bearer <token>
Idempotency-Key: 487f137d-6112-4cf9-b787-11c130d51239
Content-Type: application/json
```

```json
{
  "mode": "FULL",
  "horizon": {
    "start": "2026-08-01T07:00:00Z",
    "end": "2026-08-08T07:00:00Z"
  },
  "programmingRevisionId": "pgr_...",
  "seed": "channel-week-2026-31"
}
```

Response:

```http
202 Accepted
Location: /api/v1/background-jobs/job_...
```

```json
{
  "id": "job_...",
  "jobType": "GENERATE_SCHEDULE",
  "state": "QUEUED",
  "result": null
}
```

## Reference Plan Approval

Request:

```http
POST /api/v1/schedule-plans/pln_.../approve
Authorization: Bearer <token>
Idempotency-Key: 950982ab-4a92-42b9-a18a-a0f772cb8458
Content-Type: application/json
```

```json
{
  "validationResultId": "val_...",
  "warningAcknowledgements": [
    "LOW_CATALOG_DEPTH"
  ],
  "note": "Approved for launch week."
}
```

Response returns immutable Approval Record and approved Plan state.

## Reference Synchronization

Request:

```http
POST /api/v1/media-sources/src_.../synchronizations
Authorization: Bearer <token>
Idempotency-Key: 9c890109-148c-4d78-8589-f50599fdcf80
Content-Type: application/json
```

```json
{
  "mode": "FULL"
}
```

Response:

```http
202 Accepted
Location: /api/v1/background-jobs/job_...
```

## Reference Error

```json
{
  "error": {
    "code": "MEDIA_SOURCE_AUTHENTICATION_FAILED",
    "message": "ChannelForge could not authenticate to the Media Source.",
    "status": 422,
    "requestId": "req_...",
    "details": {
      "mediaSourceId": "src_..."
    },
    "violations": []
  }
}
```

The response does not include:

- Provider token
- Provider password
- Raw Authorization header
- Signed provider URL
- Provider stack trace

## Version 1 Required Behaviors

The version 1 API must:

1. Expose a versioned Management API.
2. Use ChannelForge domain language.
3. Use opaque ChannelForge IDs.
4. Use JSON for management requests and responses.
5. Use stable structured errors.
6. Return Request IDs.
7. Support browser sessions.
8. Support scoped API tokens.
9. Enforce authorization server-side.
10. Validate request schemas.
11. Bound request and response sizes.
12. Support stable pagination.
13. Support deterministic sorting.
14. Support documented filtering.
15. Support ETags for mutable resources.
16. Support optimistic concurrency.
17. Support Idempotency Keys for retryable mutations.
18. Return Background Jobs for long operations.
19. Support job polling and cancellation.
20. Separate streaming from JSON error envelopes.
21. Serve last valid XMLTV.
22. Serve last valid M3U.
23. Support HDHomeRun-compatible outputs.
24. Protect provider credentials.
25. Support conditional artifact requests.
26. Rate-limit sensitive endpoints.
27. Publish OpenAPI documentation.
28. Test contract and implementation drift.
29. Isolate inherited Tunarr compatibility routes.
30. Remain suitable for the first-party ChannelForge web interface.

## API Invariants

1. Database row IDs are not public contracts.
2. Provider-specific IDs are always qualified.
3. Credentials are never returned after storage.
4. Signed provider URLs are never exposed through ordinary management routes.
5. GET and HEAD do not perform editorial mutations.
6. Long-running work does not block ordinary HTTP requests indefinitely.
7. Background Job acceptance is explicit.
8. Error codes are stable.
9. Every error includes a Request ID.
10. Authorization is enforced beyond the UI.
11. Mutable updates use expected-state validation.
12. Approved revisions cannot be patched.
13. Approved Schedule Plans cannot be patched.
14. Publication requires an approved Plan.
15. Runtime recovery commands do not rewrite Schedule Plans.
16. Collection ordering is deterministic.
17. Pagination cursors are opaque.
18. Idempotency Keys are scoped and request-bound.
19. Duplicate idempotent requests do not duplicate effective commands.
20. Unknown request fields follow documented policy.
21. Validation errors do not expose internal stack traces.
22. Artifact generation failure does not remove prior valid artifact.
23. Stream responses never inject JSON errors after media output begins.
24. XMLTV and M3U use canonical Channel identity.
25. HDHomeRun compatibility models do not become canonical domain models.
26. Webhooks enqueue verification rather than directly changing canonical state.
27. Rate-limit responses are explicit.
28. Deprecated behavior has a documented replacement.
29. OpenAPI and implementation are checked for drift.
30. Version 1 remains compatible with the modular monolith.

## Deferred API Decisions

The following decisions remain open:

- Exact route names
- Exact resource envelope choice
- Exact patch format
- Exact error media type
- Exact ETag format
- Exact cursor encoding
- Exact Idempotency Key retention
- Exact API-token format
- Exact browser-session design
- Exact CSRF mechanism
- Exact role and permission matrix
- Exact rate-limit defaults
- Exact CORS defaults
- Exact request body limits
- Exact upload limits
- Exact SSE support
- Exact WebSocket support
- Exact outbound webhook support
- Exact OpenAPI generation approach
- Exact generated-client strategy
- Exact API documentation host
- Exact HDHomeRun endpoint compatibility surface
- Exact stream URL format
- Exact signed stream-token format
- Exact public XMLTV and M3U authentication policy
- Exact reverse-proxy authentication contract
- Exact Tunarr compatibility route retention period
- Exact deprecation support period
