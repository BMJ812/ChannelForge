# Access Module

## Purpose

Access owns ChannelForge management identities and authorization policy.

PR 02E establishes only the public module shell. It does not redesign or
replace inherited authentication behavior.

## Owned Concepts

- Principal
- Permission
- Resource reference
- Authorization decision

Future Access work may add management users, roles, API credentials, and
authentication identities under their assigned implementation units.

## Public Interface

The initial public boundary is `AuthorizationService`.

Callers provide a `Principal`, `Permission`, and optional `ResourceReference`
to `requirePermission()`.

`createAccessModule()` registers an externally supplied authorization service
without supplying authentication or authorization behavior itself.

## Dependencies

The initial shell has no dependency on:

- Inherited Tunarr server internals
- Persistence
- Fastify
- Inversify
- Provider clients
- Compatibility implementations

## Forbidden Dependencies

Access domain and application code must not depend directly on:

- Fastify request objects
- SQLite rows or query builders
- Provider authentication
- Media Source credentials
- FFmpeg
- Scheduling
- React

## Persistence

No Access persistence is introduced by PR 02E.

## Runtime Migration

None.

Discovery did not identify an inherited management-user or authorization
implementation suitable for migration in this unit. Provider credentials,
stream sessions, and media roles remain outside Access ownership.

## Migration Status

Shell established.

Authentication redesign, user persistence, credential storage, route migration,
and authorization implementation are deferred.
