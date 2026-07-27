# Milestone 10: Deployment, Validation, and Release

- **Roadmap version:** 0.1
- **Milestone status:** Draft
- **Last updated:** 2026-07-27
- **Risk classification:** Deployment / Migration / Release / Critical
- **Implementation authority:** Docker, Compose, Unraid, migration cutover, validation, release gates, upgrade, rollback, and legacy retirement
## Purpose

This milestone converts the completed ChannelForge architecture and implementation
workstreams into a supportable version 1 release.

It defines:

- Official container images
- Multi-stage builds
- Reproducible builds
- Image metadata
- Image tags and digests
- Multi-architecture images
- FFmpeg packaging
- Non-root execution
- PUID and PGID support
- Persistent storage
- Temporary storage
- SQLite storage requirements
- Managed assets
- Plugin storage
- Secret persistence
- Configuration precedence
- Environment variables
- Configuration files
- Docker secrets or mounted secret files
- Docker Compose
- Unraid templates
- Networking
- Reverse proxies
- TLS
- HDHomeRun-compatible discovery
- Hardware acceleration
- CPU and memory limits
- Health checks
- Startup and shutdown
- Migrations
- Migration cutover
- Backup and restore
- Upgrade and rollback
- Air-gapped installation
- Logging and observability
- Support bundles
- Operational runbooks
- Continuous integration
- Release candidates
- Release versioning
- Release notes
- Security gates
- Performance gates
- Reliability gates
- Platform gates
- Provider compatibility gates
- Output compatibility gates
- Client compatibility gates
- Legacy write retirement
- Legacy read retirement
- Release support windows
- Version 1 completion criteria

This milestone is the final implementation-roadmap milestone.

Completion authorizes the first production release candidate and closes the
architecture-first planning phase.
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
- `docs/implementation/README.md`
- `docs/implementation/01-baseline-and-change-control.md`
- `docs/implementation/02-module-boundaries.md`
- `docs/implementation/03-identity-persistence-and-migrations.md`
- `docs/implementation/04-legacy-compatibility.md`
- `docs/implementation/05-media-sources-and-catalog.md`
- `docs/implementation/06-networks-and-channels.md`
- `docs/implementation/07-deterministic-scheduling.md`
- `docs/implementation/08-publication-playout-and-output.md`
- `docs/implementation/09-api-ui-security-and-plugins.md`

## Milestone Mission

- Ship ChannelForge as one documented container image.
- Preserve all durable state outside the replaceable container image.
- Keep SQLite on supported local storage.
- Support Docker Compose and Unraid with the same architecture.
- Run as a non-root user where practical.
- Support PUID, PGID, and supplemental groups without recursively changing media ownership.
- Bundle or validate a predictable FFmpeg build.
- Support optional Intel, NVIDIA, and other documented hardware acceleration paths.
- Make network exposure explicit.
- Keep public output disabled by default.
- Distinguish liveness, readiness, and detailed health.
- Back up before destructive migration or upgrade steps.
- Prove backup validity by restoring it.
- Make startup migrations deterministic, restart-safe, and observable.
- Move authority from inherited Tunarr state to ChannelForge state through controlled cutover.
- Freeze legacy writes before retiring them.
- Preserve compatibility reads for a defined support window.
- Test Linux as the production authority.
- Keep Windows useful for development without treating Windows-specific failures as production truth.
- Validate amd64 and arm64 only where officially supported.
- Test Plex, Jellyfin, and Emby adapter contracts.
- Validate XMLTV, M3U, IPTV, and HDHomeRun-compatible behavior.
- Validate deterministic scheduling across platforms.
- Validate playout continuity and FFmpeg supervision.
- Validate authentication, authorization, secrets, plugins, and public-output security.
- Publish release artifacts with checksums, provenance, notices, and a software bill of materials where practical.
- Document install, upgrade, rollback, backup, restore, troubleshooting, and incident recovery.
- Define release blockers and waiver policy.
- Retire legacy state only after evidence proves it is unused and recoverable.

## Product Principle

The governing product principle remains:

> Build television networks, not playlists.

The release is complete only when the deployed product preserves the Network-first
domain model through installation, migration, scheduling, publication, playout,
guide output, API use, UI use, and recovery.

A successful container start is not sufficient release evidence.
## Deployment Principles

1. Durable state lives outside the image.
2. The container is replaceable.
3. SQLite remains local to supported storage.
4. Startup validates before accepting normal traffic.
5. Migrations are controlled and backed up.
6. The application uses least privilege.
7. Device access is explicit.
8. Network exposure is explicit.
9. Public access is disabled by default.
10. Health distinguishes liveness from readiness.
11. Backups are routine operations.
12. Upgrades are reversible where schema compatibility permits.
13. Secrets are not embedded in images or ordinary Compose files.
14. Compose and Unraid express the same architecture.
15. Host networking is optional and justified.
16. Storage paths are inspectable.
17. Container recreation does not erase editorial state.
18. Running version and revision are visible.
19. Support bundles redact secrets.
20. Release gates are evidence-driven.

## Official Support Scope

- Docker Engine on Linux
- Docker Compose
- Unraid Community Applications-style template deployment
- Single ChannelForge application container
- SQLite persistence
- Managed local filesystem storage
- Optional reverse proxy
- Optional GPU or media-device access
- Local network clients
- Plex, Jellyfin, and Emby on reachable networks
- XMLTV, M3U, IPTV, and HDHomeRun-compatible output
- linux/amd64
- linux/arm64 only after passing its release matrix
- Windows as a development environment

## Deployment Non-Goals

- Kubernetes
- Nomad
- Docker Swarm
- Multi-node active-active operation
- Managed cloud database
- Distributed filesystem
- Required object storage
- External message queue
- Required separate transcoder nodes
- Windows service installation
- macOS native service installation
- High-availability failover
- Automatic horizontal scaling
- Mandatory rootless support on every platform

## Primary Deployment Unit

The primary deployment unit is one ChannelForge container containing:

- Web application
- Management and runtime APIs
- First-party UI
- Scheduling engine
- Integration adapters
- Playout runtime
- FFmpeg supervisor
- SQLite client
- Background Job workers
- Artifact generators
- HDHomeRun-compatible HTTP service
- Optional discovery service
- Plugin runtime broker

Version 1 does not require separate database, queue, scheduler, web UI, or
transcoder-coordinator services.
## Process Model

- One parent application process
- Child FFmpeg processes
- Optional isolated plugin processes
- Internal worker threads or subprocesses
- Container entrypoint remains lifecycle supervisor
- Signals are forwarded correctly
- Child processes are reaped
- Shutdown is bounded
- Orphaned runtime state is reconciled at startup

## Official Image Requirements

- Contain the ChannelForge application
- Contain or provide a supported FFmpeg build
- Contain required runtime dependencies
- Use a minimal maintained base image
- Declare version metadata
- Expose documented ports
- Provide a health probe
- Run as non-root where practical
- Exclude unnecessary compilers and build tools
- Support amd64
- Support arm64 only after validation
- Include license and notice material
- Include Tunarr attribution
- Provide SBOM where practical
- Publish checksums and digest
- Avoid embedded secrets

## Image Build Stages

1. Dependency resolution
2. Source and license verification
3. Application build
4. Static analysis and type checking
5. Unit and component tests
6. Runtime assembly
7. FFmpeg integration
8. Metadata and notices
9. Image vulnerability scan
10. Container smoke test
11. Multi-architecture manifest publication

## Reproducible Build Inputs

- Dependency lockfile
- Node.js runtime version
- pnpm version
- Base-image digest where feasible
- FFmpeg source or package version
- Native dependency versions
- Build arguments
- Git revision
- Source-date or build timestamp policy
- License inventory
- Build workflow version

## Image Metadata

- Application name
- Application version
- Source repository
- Git revision
- Build timestamp
- License
- Documentation URL
- Vendor
- Supported architecture
- FFmpeg version
- Schema compatibility range
- Migration compatibility range

## Image Tag Strategy

- Immutable release tag, such as `1.0.0`
- Major-minor convenience tag, such as `1.0`
- Stable channel tag
- Beta channel tag
- Development or edge tag
- Immutable digest reference
- Release documentation recommends exact version or digest for reproducible production deployments
- Floating tags are convenience aliases and are never the sole rollback reference

## Multi-Architecture Images

### linux/amd64

- Application build succeeds.
- Type checking succeeds.
- Native dependencies load.
- SQLite operates on supported storage.
- FFmpeg reports expected capabilities.
- Container starts as configured user.
- Health checks pass.
- Migration tests pass.
- Backup and restore tests pass.
- Output smoke tests pass.
- Architecture-specific limitations are documented.

### linux/arm64

- Application build succeeds.
- Type checking succeeds.
- Native dependencies load.
- SQLite operates on supported storage.
- FFmpeg reports expected capabilities.
- Container starts as configured user.
- Health checks pass.
- Migration tests pass.
- Backup and restore tests pass.
- Output smoke tests pass.
- Architecture-specific limitations are documented.

## Base Image Selection

- Maintained and vulnerability-scanned
- Compatible with supported Node.js runtime
- Compatible with SQLite native requirements
- Compatible with FFmpeg
- Compatible with hardware drivers
- Predictable certificate and time-zone data
- Minimal final runtime surface
- Supports non-root execution
- Supports required shell or entrypoint behavior

## FFmpeg Packaging

- FFmpeg availability is predictable.
- Bundled or installed version is pinned.
- Application reports path and version.
- Application reports encoders, decoders, protocols, filters, and hardware capabilities.
- Release tests use the same FFmpeg build as the image.
- License implications are documented.
- Unsupported custom binaries produce a warning.
- Ordinary UI cannot select arbitrary executable paths.

## FFmpeg Override

- Explicit configuration only
- Startup validation
- Version reporting
- Capability reporting
- Compatibility warning
- No silent fallback to unknown system binary
- No arbitrary command construction
- Support status clearly marked

## Container User

- Run as non-root where practical.
- Require write access only to managed durable and temporary paths.
- Require read access to media mounts only when direct paths are used.
- Require explicit device access for hardware acceleration.
- Require explicit backup-destination access.
- Report effective UID, GID, and supplemental groups.
- Root execution produces a warning and does not disable application security.

## PUID and PGID

- Accept validated numeric values.
- Avoid silently running as root.
- Apply ownership changes only to managed paths.
- Do not recursively chown external media libraries.
- Report effective values at startup.
- Document behavior when host IDs do not exist in image.
- Support supplemental media, video, and render groups.

## Filesystem Layout

Suggested layout:

```text
/config
/config/database
/config/assets
/config/artifacts
/config/plugins
/config/secrets
/config/logs
/config/backups
/config/state
/cache
/tmp/channel-forge
/media
/backups
```

Exact directories may be consolidated, but durable, rebuildable, temporary,
backup, and optional media paths remain distinguishable.
## Durable State

- SQLite database
- Managed assets
- Artwork
- Branding
- Presentation media
- Plugin packages
- Plugin state
- Output artifacts
- Secret ciphertext
- Audit records
- Migration metadata
- Backup metadata
- Release and schema markers

## Rebuildable State

- Search projections
- Provider artwork cache
- Temporary transcode cache
- Temporary HLS segments
- Generated diagnostics
- Upload staging
- Download staging
- Transient provider caches

## Temporary Storage

- Writable
- Bounded by size or policy
- Suitable for FFmpeg and HLS workload
- Cleaned at startup and shutdown
- Excluded from authoritative backup
- Not required to survive restart
- Protected from path traversal
- Produces health warnings when low on space
- Does not require tmpfs

## SQLite Storage Requirements

- Local filesystem supported for SQLite
- No unsupported network filesystem by default
- WAL or selected journal mode validated
- Busy timeout configured
- Foreign keys enabled
- Integrity check available
- Database and WAL files remain in same supported storage context
- Atomic rename semantics available
- Sufficient free space
- File permissions restricted
- Backup uses a SQLite-safe method
- Migration lock is explicit
- Only one authoritative application writer

## Managed File Requirements

- Every managed file has an owner and purpose.
- Writes use staging and atomic replacement where required.
- Checksums identify immutable artifacts.
- Path traversal is rejected.
- Symlink escape is rejected or bounded.
- Permissions are validated.
- Orphan cleanup is bounded and auditable.
- Backups include authoritative managed files.

## Configuration Model

Configuration sources may include:

1. Built-in safe defaults
2. Persistent configuration
3. Environment variables
4. Mounted secret files
5. Explicit command-line arguments
6. Runtime administrative settings where allowed

Precedence must be documented and deterministic.
## Configuration Classes

### Startup-Critical

data path, port bindings, secret-key source, migration mode
- Has one documented authority.
- Has validation.
- Has safe default or required-state behavior.
- Is included in diagnostics only when nonsecret or redacted.
- Has migration and deprecation policy.

### Runtime-Mutable

selected operational defaults changed through authenticated UI
- Has one documented authority.
- Has validation.
- Has safe default or required-state behavior.
- Is included in diagnostics only when nonsecret or redacted.
- Has migration and deprecation policy.

### Restart-Required

network listeners, process model, hardware device policy
- Has one documented authority.
- Has validation.
- Has safe default or required-state behavior.
- Is included in diagnostics only when nonsecret or redacted.
- Has migration and deprecation policy.

### Secret

credentials, token signing keys, backup keys
- Has one documented authority.
- Has validation.
- Has safe default or required-state behavior.
- Is included in diagnostics only when nonsecret or redacted.
- Has migration and deprecation policy.

### Derived

detected FFmpeg capabilities, host architecture, active schema version
- Has one documented authority.
- Has validation.
- Has safe default or required-state behavior.
- Is included in diagnostics only when nonsecret or redacted.
- Has migration and deprecation policy.

### Deprecated

legacy environment variables retained for a support window
- Has one documented authority.
- Has validation.
- Has safe default or required-state behavior.
- Is included in diagnostics only when nonsecret or redacted.
- Has migration and deprecation policy.

## Environment Variable Policy

- Stable prefix
- Documented type and default
- Unknown variable warning where practical
- No secret value echoed
- Boolean parsing is strict
- Numeric bounds are validated
- Path values are normalized
- Deprecated names map through explicit compatibility
- Startup report shows source without secret value

## Secret Configuration

- Prefer mounted files or Secret Service references.
- Environment variables are supported only with explicit documentation.
- Secrets do not appear in generated Compose examples.
- Secret file permissions are validated.
- Secret key persistence is required for encrypted data.
- Rotation and recovery procedures are documented.
- Support bundles omit secret values.

## Port Inventory

### Management and UI HTTP

- Protocol: TCP
- Status: Required
- Default binding is documented.
- Exposure is explicit.
- Firewall expectations are documented.
- Authentication and rate policy are documented.

### Streaming and artifacts

- Protocol: TCP
- Status: May share HTTP listener
- Default binding is documented.
- Exposure is explicit.
- Firewall expectations are documented.
- Authentication and rate policy are documented.

### HDHomeRun-compatible HTTP

- Protocol: TCP
- Status: May share HTTP listener
- Default binding is documented.
- Exposure is explicit.
- Firewall expectations are documented.
- Authentication and rate policy are documented.

### HDHomeRun discovery

- Protocol: UDP
- Status: Optional
- Default binding is documented.
- Exposure is explicit.
- Firewall expectations are documented.
- Authentication and rate policy are documented.

### Development diagnostics

- Protocol: TCP
- Status: Disabled in release
- Default binding is documented.
- Exposure is explicit.
- Firewall expectations are documented.
- Authentication and rate policy are documented.

## Networking Modes

### Bridge Networking

- Supported use cases are documented.
- Media Source reachability is tested.
- Client reachability is tested.
- Public-output exposure is explicit.
- Reverse-proxy behavior is documented.
- HDHomeRun discovery implications are documented.
- Security tradeoffs are stated.

### Host Networking

- Supported use cases are documented.
- Media Source reachability is tested.
- Client reachability is tested.
- Public-output exposure is explicit.
- Reverse-proxy behavior is documented.
- HDHomeRun discovery implications are documented.
- Security tradeoffs are stated.

### Custom Docker Network

- Supported use cases are documented.
- Media Source reachability is tested.
- Client reachability is tested.
- Public-output exposure is explicit.
- Reverse-proxy behavior is documented.
- HDHomeRun discovery implications are documented.
- Security tradeoffs are stated.

## Host Networking Policy

- Not required for ordinary HTTP, M3U, or XMLTV operation.
- May simplify UDP discovery.
- Expands network exposure.
- Requires explicit operator selection.
- Unraid template explains the tradeoff.
- Manual discovery URL remains available when broadcast is unavailable.

## Reverse Proxy

- Optional
- Trusted proxy addresses or hops are explicit
- Public base URL may be configured
- Forwarded headers are ignored from untrusted peers
- WebSocket or streaming behavior is validated
- Long-lived response timeouts are documented
- Buffering behavior is documented
- Request-body limits are documented
- TLS termination assumptions are explicit

## TLS

- Direct application TLS may be optional.
- Reverse-proxy TLS is documented.
- Remote management without protected transport produces a warning or block according to policy.
- HSTS is enabled only when deployment is suitable.
- Certificate and key paths are secret-sensitive.
- Self-signed certificate behavior is documented.
- Provider outbound TLS policy remains source-specific.

## HDHomeRun-Compatible Discovery

- HTTP discovery works without UDP broadcast.
- UDP discovery is optional and separately enabled.
- Device ID is stable.
- Tuner count reflects configured capacity.
- Interface selection is explicit.
- Multiple-interface behavior is documented.
- Docker bridge limitations are documented.
- Unraid host-network option is documented.
- Firewall and broadcast requirements are documented.

## Hardware Acceleration

### Intel Quick Sync / VA-API

- /dev/dri mapping
- render and video groups
- capability detection
- Startup reports availability.
- Runtime reservations are bounded.
- Fallback policy is explicit.
- Release notes list tested environment.

### NVIDIA NVENC

- NVIDIA container runtime
- device visibility
- driver compatibility
- Startup reports availability.
- Runtime reservations are bounded.
- Fallback policy is explicit.
- Release notes list tested environment.

### Software Encoding

- CPU fallback
- thread and concurrency limits
- resource warning
- Startup reports availability.
- Runtime reservations are bounded.
- Fallback policy is explicit.
- Release notes list tested environment.

### Other Backends

- unsupported unless tested
- explicit documentation
- no implied guarantee
- Startup reports availability.
- Runtime reservations are bounded.
- Fallback policy is explicit.
- Release notes list tested environment.

## CPU, Memory, and Resource Limits

- Application remains functional under documented CPU limits.
- Memory use is measured for Catalog sync, scheduling, XMLTV generation, and playout.
- FFmpeg and plugin processes count toward resource policy.
- OOM behavior is tested.
- HLS and temporary storage are bounded.
- Concurrent transcodes are bounded.
- Source connections are bounded.
- Open file limits are documented.
- Resource exhaustion produces health findings and structured failures.

## Docker Compose

- Exact image tag or digest example
- Persistent `/config` mount
- Optional cache and backup mounts
- Optional read-only media mounts
- PUID and PGID
- Time zone
- Ports
- Health check
- Restart policy
- Optional GPU devices
- Optional supplemental groups
- Optional reverse-proxy labels in a separate example
- No embedded reusable secret

## Compose Profiles

### Default

bridge networking, no GPU, local HTTP
- Uses the same application architecture.
- Documents security implications.
- Has a smoke test or manual validation.
- Does not modify durable-data semantics.

### Intel GPU

device mapping and render group
- Uses the same application architecture.
- Documents security implications.
- Has a smoke test or manual validation.
- Does not modify durable-data semantics.

### NVIDIA GPU

NVIDIA runtime configuration
- Uses the same application architecture.
- Documents security implications.
- Has a smoke test or manual validation.
- Does not modify durable-data semantics.

### Host Discovery

host networking for UDP discovery
- Uses the same application architecture.
- Documents security implications.
- Has a smoke test or manual validation.
- Does not modify durable-data semantics.

### Reverse Proxy

public base URL and trusted proxy
- Uses the same application architecture.
- Documents security implications.
- Has a smoke test or manual validation.
- Does not modify durable-data semantics.

### Air-Gapped

local image archive and no update checks
- Uses the same application architecture.
- Documents security implications.
- Has a smoke test or manual validation.
- Does not modify durable-data semantics.

## Unraid Template

- Repository and image tag
- Web UI URL
- Icon
- Support URL
- Project URL
- Network mode
- Management port
- Optional discovery port
- `/config` mapping
- Optional `/media` mapping
- Optional `/backups` mapping
- PUID
- PGID
- Time zone
- Supplemental groups
- Intel device mapping guidance
- NVIDIA runtime guidance
- Public base URL
- Trusted proxy
- Health-check guidance

## Unraid Template Requirements

- Safe defaults
- Clear field descriptions
- No plaintext provider credentials in template
- No root requirement
- No recursive ownership changes over media
- Host networking only when selected
- Bridge mode supported for ordinary operation
- Persistent state survives update and recreation
- Upgrade and rollback instructions reference exact tags
- Community Applications metadata validates

## Startup Sequence

1. Start container entrypoint.
2. Report build and architecture.
3. Resolve effective UID, GID, and groups.
4. Validate durable and temporary paths.
5. Validate secret-key availability.
6. Validate configuration.
7. Validate SQLite storage and free space.
8. Acquire instance lock.
9. Inspect current schema and application markers.
10. Create pre-migration backup when required.
11. Run or resume migration.
12. Validate migration result.
13. Initialize repositories and projections.
14. Validate FFmpeg path and capabilities.
15. Validate plugin packages and registrations.
16. Recover stale jobs and runtime sessions.
17. Load active Publications.
18. Regenerate expired or missing derived artifacts when safe.
19. Start background workers.
20. Mark readiness.
21. Accept normal traffic.

## Startup Failure Classes

### Invalid configuration

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Unwritable data path

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Unsupported SQLite storage

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Missing encryption key

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Migration conflict requiring operator

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Migration failure

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Corrupt database

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Insufficient disk space

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Unsupported application downgrade

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Missing FFmpeg

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Plugin integrity failure

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

### Port collision

- Readiness remains false.
- Liveness remains true when operator remediation is possible.
- Error is actionable.
- Secrets are redacted.
- Active data is not silently replaced.
- Recovery or rollback path is documented.

## Shutdown Sequence

1. Stop accepting privileged mutations where necessary.
2. Mark readiness false.
3. Stop new Background Jobs.
4. Stop new client attachments.
5. Drain or terminate client sessions according to timeout.
6. Stop shared Channel Sessions.
7. Gracefully stop FFmpeg processes.
8. Force terminate after bounded timeout.
9. Stop plugin processes.
10. Checkpoint resumable jobs.
11. Flush audit and state transitions.
12. Close SQLite connections.
13. Release instance lock.
14. Clean bounded temporary files.
15. Exit with meaningful status.

## Health Checks

### Liveness

Process can respond; reveals minimal information.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Readiness

Instance can serve normal traffic safely.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Detailed Health

Authenticated component and dependency status.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Storage Health

Database, WAL, managed files, free space, and permissions.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Migration Health

Current version, state, conflict count, and rollback point.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Integration Health

Plex, Jellyfin, and Emby source state.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Scheduling Health

Generator readiness and stale-plan findings.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Publication Health

Active publication and artifact age.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Playout Health

Sessions, FFmpeg, resources, and recovery.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

### Plugin Health

Integrity, compatibility, runtime, and quarantine.
- Has stable machine-readable state.
- Has operator-readable detail.
- Has bounded execution time.
- Does not expose secrets.
- Has release tests.

## Migration Cutover

The release migration follows phased replacement.

Authority must be explicit for every concept and release phase.

At no time may legacy and ChannelForge stores accept independent authoritative
writes for the same concept without deterministic reconciliation.
## Migration Release Phases

### Inventory

Record schema, settings, files, routes, runtime behavior, and source-of-truth classes.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Mapping

Create ChannelForge IDs and legacy identity mappings.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Compatibility Reads

Read canonical state first and legacy state through controlled fallback.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Media Source Cutover

Move credentials and source configuration to ChannelForge ownership.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Catalog Cutover

Move programs into Catalog Items, Source Bindings, and Playback Variants.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Network and Channel Cutover

Move editorial and output identity.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Programming Cutover

Move scheduling intent into immutable revisions.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Scheduling Cutover

Generate and approve ChannelForge Schedule Plans.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Publication and Runtime Cutover

Switch artifacts and stream authority.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### First-Party API and UI Cutover

Remove first-party legacy callers.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Legacy Write Freeze

Block inherited mutations server-side.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Legacy Write Removal

Remove obsolete writers after support evidence.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Legacy Read Support Window

Retain measured compatibility reads.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Legacy Read Retirement

Remove after release and usage gates.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

### Legacy State Cleanup

Delete only in a later explicit destructive migration.
- Has entry criteria.
- Has one write authority.
- Has verification checkpoints.
- Has a backup and rollback point.
- Has operator-visible conflicts.
- Has metrics and completion evidence.

## Migration Run Requirements

- Source application and schema version
- Target application and schema version
- Migration state
- Current phase
- Backup reference
- Identity-mapping counts
- Conflict counts
- Warning counts
- Input and output checksums
- Resume token
- Rollback point
- Audit reference

## Migration Execution Rules

- Deterministic
- Versioned
- Idempotent
- Restart-safe
- Checkpointed only after committed work
- Bounded transactions
- No provider calls inside write transactions
- No destructive step without backup
- No silent conflict resolution
- No automatic renumbering without approved policy
- No legacy identifier reuse as canonical identity
- No deletion of unknown legacy state

## Migration Validation

- Schema version
- Row and entity counts
- Identity mapping uniqueness
- Media Source connectivity
- Catalog Item counts
- Source Binding and Playback Variant counts
- Network and Channel identity
- Channel number and guide ID
- Programming revision content hashes
- Schedule coverage
- Publication pointers
- XMLTV and M3U consistency
- HDHomeRun lineup
- Stream preview
- Credential availability
- Audit continuity
- Plugin state
- Managed assets

## Migration Conflict Policy

### Duplicate Channel number

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Duplicate guide ID

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Invalid time zone

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Unknown provider identity

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Ambiguous Catalog match

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Unsupported schedule rule

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Missing media

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Invalid credential

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Corrupt legacy record

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Unknown managed file

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Plugin modification

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

### Unsupported output setting

- Preserve source evidence.
- Create durable conflict.
- Do not guess operator intent.
- Permit pause and resume.
- Provide explicit remediation.
- Record decision and audit.

## Backup Strategy

- SQLite database
- WAL and associated database state through safe backup mechanism
- Managed assets
- Branding and presentation media
- Plugin packages and state
- Output artifacts where policy includes them
- Secret ciphertext
- Migration metadata
- Audit records
- Configuration snapshot
- Application and schema version
- Backup manifest and checksums

## Backup Requirements

- Consistent point-in-time state
- Background Job
- Progress and cancellation policy
- Checksum manifest
- Free-space validation
- Destination validation
- Optional encryption
- Secret-aware handling
- Retention policy
- No plaintext credentials in logs
- Restore test evidence

## Backup Types

### Pre-Migration Backup

- Purpose is explicit.
- Contents are documented.
- Security classification is documented.
- Retention is documented.
- Restore capability or non-restore limitation is explicit.
- Checksum or integrity evidence is included.

### Manual Full Backup

- Purpose is explicit.
- Contents are documented.
- Security classification is documented.
- Retention is documented.
- Restore capability or non-restore limitation is explicit.
- Checksum or integrity evidence is included.

### Scheduled Backup

- Purpose is explicit.
- Contents are documented.
- Security classification is documented.
- Retention is documented.
- Restore capability or non-restore limitation is explicit.
- Checksum or integrity evidence is included.

### Pre-Upgrade Backup

- Purpose is explicit.
- Contents are documented.
- Security classification is documented.
- Retention is documented.
- Restore capability or non-restore limitation is explicit.
- Checksum or integrity evidence is included.

### Configuration Export

- Purpose is explicit.
- Contents are documented.
- Security classification is documented.
- Retention is documented.
- Restore capability or non-restore limitation is explicit.
- Checksum or integrity evidence is included.

### Support Bundle

- Purpose is explicit.
- Contents are documented.
- Security classification is documented.
- Retention is documented.
- Restore capability or non-restore limitation is explicit.
- Checksum or integrity evidence is included.

## Restore Preparation

1. Select backup.
2. Verify manifest and checksums.
3. Verify application and schema compatibility.
4. Verify encryption key availability.
5. Verify free space.
6. Stop normal mutations.
7. Create current-state safety backup.
8. Restore into staging.
9. Run SQLite integrity check.
10. Validate managed files.
11. Validate secret decryption.
12. Validate migration markers.
13. Produce restore preview.
14. Require operator confirmation.

## Restore Activation

1. Stop runtime sessions and workers.
2. Acquire exclusive instance lock.
3. Atomically replace durable state where feasible.
4. Start with readiness false.
5. Run required forward migrations.
6. Validate restored state.
7. Rebuild derived projections.
8. Regenerate replaceable artifacts.
9. Release lock.
10. Start workers.
11. Mark readiness after verification.
12. Record audit and restore report.

## Restore Failure

- Do not discard pre-restore state.
- Keep readiness false.
- Preserve staging evidence.
- Offer rollback to safety backup.
- Redact secrets.
- Record exact failed phase.

## Upgrade Policy

- Read release notes before update.
- Record current image tag and digest.
- Create backup.
- Verify available storage.
- Pull exact target image.
- Stop container cleanly.
- Start target image with same durable storage.
- Run startup validation and migration.
- Verify readiness.
- Run post-upgrade smoke tests.
- Retain prior image and backup through rollback window.

## Upgrade Compatibility

### Compatible

Direct upgrade supported.
- Detected before destructive action.
- Shown in UI and startup logs.
- Documented in release notes.
- Covered by upgrade tests.

### Migration Required

Automatic or operator-mediated migration required.
- Detected before destructive action.
- Shown in UI and startup logs.
- Documented in release notes.
- Covered by upgrade tests.

### Backup Required

Upgrade blocked without successful backup.
- Detected before destructive action.
- Shown in UI and startup logs.
- Documented in release notes.
- Covered by upgrade tests.

### Manual Step Required

Release notes require operator action.
- Detected before destructive action.
- Shown in UI and startup logs.
- Documented in release notes.
- Covered by upgrade tests.

### Unsupported Skip

Intermediate version required.
- Detected before destructive action.
- Shown in UI and startup logs.
- Documented in release notes.
- Covered by upgrade tests.

### Downgrade Blocked

Schema or state cannot be read safely by older version.
- Detected before destructive action.
- Shown in UI and startup logs.
- Documented in release notes.
- Covered by upgrade tests.

## Rollback Policy

- Rollback target image is recorded.
- Rollback point includes backup and schema version.
- Downgrade compatibility is checked.
- No older binary starts against unsupported newer schema.
- Rollback may restore backup rather than run reverse migration.
- Active publication and artifacts are preserved when safe.
- Plugin version compatibility is checked.
- Rollback is audited.

## Air-Gapped Operation

- Image can be exported and imported as an archive.
- Release checksums can be transferred separately.
- No required runtime dependency on external update servers.
- Provider connectivity remains local or explicitly configured.
- Plugin installation can use local packages.
- Documentation is bundled or available offline.
- Update checks can be disabled.
- Time-zone and certificate data are included.

## Logging

- Structured logs to standard output
- Optional managed-file logs
- Log level configuration
- Request and correlation IDs
- Application version and revision
- Migration phase
- Background Job IDs
- Session and FFmpeg process references
- Secret redaction
- Rotation for managed-file logs
- No unbounded provider payload logging

## Observability

### Build

- version
- revision
- architecture
- FFmpeg version
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Storage

- database size
- WAL size
- free space
- managed-file usage
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Migration

- phase
- items
- conflicts
- checkpoint
- duration
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Catalog

- items
- bindings
- variants
- sync freshness
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Scheduling

- generation duration
- failures
- checksums
- staleness
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Publication

- active revision
- artifact age
- last-known-good
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Playout

- sessions
- clients
- FFmpeg
- recovery
- drift
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Security

- login failures
- permission denials
- public-output state
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Plugins

- integrity
- runtime
- jobs
- quarantine
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

### Backup

- last success
- age
- restore-test state
- Metrics are bounded.
- Identifiers are attributable.
- Secrets are absent.
- Health state is documented.

## Support Bundle

- Application version and revision
- Platform and architecture
- Container metadata
- Effective nonsecret configuration
- Path and permission summary
- Storage health
- Schema and migration state
- Provider adapter versions
- Source health without credentials
- Catalog and schedule counts
- Publication and artifact state
- Runtime and FFmpeg capability summary
- Plugin manifest and trust summary
- Recent bounded logs
- Recent Background Job failures
- Audit summary
- Redaction report

## Support Bundle Requirements

- Operator preview
- Explicit authorization
- Bounded size
- Secret sentinel test
- No raw provider credentials
- No full signed URLs
- No private keys
- No unnecessary personal client data
- Checksum
- Expiration and cleanup

## Operational Runbooks

### Initial Installation

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Docker Compose Installation

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Unraid Installation

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### First-Time Setup

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Add Plex Source

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Add Jellyfin Source

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Add Emby Source

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Enable Intel Hardware Acceleration

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Enable NVIDIA Hardware Acceleration

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Configure Reverse Proxy

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Enable HDHomeRun Discovery

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Create Backup

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Restore Backup

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Upgrade

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Rollback

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Resolve Migration Conflict

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Recover from Database Corruption

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Recover from Disk Full

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Recover from Missing Encryption Key

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Recover from FFmpeg Failure

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Recover from Plugin Failure

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Rotate Credentials

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Collect Support Bundle

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Disable Public Output

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

### Emergency Maintenance Mode

- Purpose
- Prerequisites
- Commands or UI path
- Expected result
- Verification
- Failure handling
- Rollback
- Security notes

## Testing Authority

Linux containers are the production authority.

Windows remains a supported development environment but does not override Linux
truth for POSIX paths, signals, hardware devices, host networking, or Unraid.
## Test Layers

### Unit

Pure and narrowly scoped behavior.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Domain

Aggregate invariants without infrastructure.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Component

One application module with controlled dependencies.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Integration

Real collaboration between modules and infrastructure.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Contract

Stable interface behavior.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### End-to-End

Complete workflows through public interfaces.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Platform

Operating system, architecture, container, storage, devices, and networking.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Compatibility

Providers, clients, and inherited behavior.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Performance

Capacity, latency, throughput, and resource use.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

### Reliability

Recovery, fault containment, and long-running behavior.
- Has deterministic fixtures where applicable.
- Has explicit authority classification.
- Produces attributable results.
- Failure blocks the appropriate gate.

## Authoritative Linux Release Suite

- Build
- Type checking
- Unit tests
- Domain tests
- Component tests
- Integration tests
- Repository contract tests
- SQLite tests
- API contract tests
- OpenAPI drift tests
- Security tests
- Plugin tests
- Docker image tests
- Migration tests
- Backup and restore tests
- Stream smoke tests
- M3U validation
- XMLTV validation
- HDHomeRun-compatible validation
- Scheduling determinism
- Publication and playout tests

## Windows Development Suite

- Build
- Type checking
- Pure domain tests
- Platform-neutral API component tests
- PowerShell workflows
- Path handling
- Drive-letter and UNC policy
- Line-ending safety
- Repository scripts
- Documentation commands
- Known EBUSY classification

## Architecture Matrix

### linux/amd64

- Authority: Required release authority
- Build result recorded.
- Test result recorded.
- Image or workflow revision recorded.
- FFmpeg version recorded.
- Known limitations recorded.

### linux/arm64

- Authority: Required only when officially supported
- Build result recorded.
- Test result recorded.
- Image or workflow revision recorded.
- FFmpeg version recorded.
- Known limitations recorded.

### windows/amd64

- Authority: Development and workflow validation
- Build result recorded.
- Test result recorded.
- Image or workflow revision recorded.
- FFmpeg version recorded.
- Known limitations recorded.

### Unraid amd64

- Authority: Required deployment validation
- Build result recorded.
- Test result recorded.
- Image or workflow revision recorded.
- FFmpeg version recorded.
- Known limitations recorded.

## Determinism Gates

### Schedule Plans

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Catalog normalization

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Catalog matching

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Candidate ordering

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Random selection

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Rule evaluation

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### XMLTV

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### M3U

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### API pagination

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Projection rebuild

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Migration output

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Plugin rule behavior

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

### Artifact checksums

- Fixed input fixture
- Fixed clock
- Fixed time zone
- Fixed seed where relevant
- Stable canonical serialization
- Expected checksum
- Repeated-run comparison
- Cross-platform semantic comparison where required

## Provider Compatibility Matrix

### Plex

- Connection and authentication
- Server identity
- Library discovery
- Full synchronization
- Incremental synchronization where supported
- Movie
- Series
- Season
- Episode
- Special
- Multiple playback variants
- Artwork
- Deletion
- Partial response
- Rate limiting
- Playback resolution
- Direct play
- Remux
- Transcode
- Credential rotation
- Fixture version recorded.
- Supported provider versions documented.
- Real-server test is supplemental.

### Jellyfin

- Connection and authentication
- Server identity
- Library discovery
- Full synchronization
- Incremental synchronization where supported
- Movie
- Series
- Season
- Episode
- Special
- Multiple playback variants
- Artwork
- Deletion
- Partial response
- Rate limiting
- Playback resolution
- Direct play
- Remux
- Transcode
- Credential rotation
- Fixture version recorded.
- Supported provider versions documented.
- Real-server test is supplemental.

### Emby

- Connection and authentication
- Server identity
- Library discovery
- Full synchronization
- Incremental synchronization where supported
- Movie
- Series
- Season
- Episode
- Special
- Multiple playback variants
- Artwork
- Deletion
- Partial response
- Rate limiting
- Playback resolution
- Direct play
- Remux
- Transcode
- Credential rotation
- Fixture version recorded.
- Supported provider versions documented.
- Real-server test is supplemental.

## Output Compatibility Matrix

### XMLTV

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

### M3U

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

### MPEG-TS stream

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

### HLS stream

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

### HDHomeRun HTTP discovery

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

### HDHomeRun UDP discovery

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

### HDHomeRun lineup

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

### Now/Next

- Contract fixture
- Identity consistency
- Escaping and encoding
- Authentication policy
- Caching policy
- Error behavior
- Large-output behavior
- Restart behavior
- Last-known-good behavior

## Client Compatibility Matrix

### Plex Live TV

- Discovery or configuration method
- Channel lineup
- Guide mapping
- Stream startup
- Join in progress
- Channel transition
- Reconnect
- Authentication
- Known limitations

### Jellyfin Live TV

- Discovery or configuration method
- Channel lineup
- Guide mapping
- Stream startup
- Join in progress
- Channel transition
- Reconnect
- Authentication
- Known limitations

### Emby Live TV

- Discovery or configuration method
- Channel lineup
- Guide mapping
- Stream startup
- Join in progress
- Channel transition
- Reconnect
- Authentication
- Known limitations

### VLC

- Discovery or configuration method
- Channel lineup
- Guide mapping
- Stream startup
- Join in progress
- Channel transition
- Reconnect
- Authentication
- Known limitations

### IPTV client reference

- Discovery or configuration method
- Channel lineup
- Guide mapping
- Stream startup
- Join in progress
- Channel transition
- Reconnect
- Authentication
- Known limitations

### Browser HLS reference

- Discovery or configuration method
- Channel lineup
- Guide mapping
- Stream startup
- Join in progress
- Channel transition
- Reconnect
- Authentication
- Known limitations

## SQLite Validation

- Fresh database
- Upgrade from each supported schema
- WAL recovery
- Busy timeout
- Concurrent read and write
- Crash during migration
- Disk full
- Permission denied
- Integrity check
- Backup under load
- Restore
- Large Catalog
- Large Schedule Plan
- Audit growth

## Migration Fixture Matrix

### Empty Tunarr installation

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Single Channel

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Multiple Channels

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Plex-only installation

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Jellyfin-only installation

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Emby-only installation

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Mixed providers

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Custom shows

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Filler lists

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Duplicate programs

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Invalid time zone

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Duplicate Channel number

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Missing provider item

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Corrupt record

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Large library

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Existing XMLTV and M3U settings

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Existing HDHomeRun settings

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Existing FFmpeg settings

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

### Legacy route automation

- Pre-migration backup
- Inventory checksum
- Expected identity mappings
- Expected conflicts
- Expected canonical counts
- Validation result
- Rollback result
- Resume result

## Backup and Restore Tests

### Idle instance

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Active Catalog synchronization

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Active schedule generation

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Active stream sessions

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Large database

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Large managed assets

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Encrypted backup

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Interrupted backup

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Insufficient space

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Corrupt archive

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Wrong key

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Restore to same version

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Restore then forward migrate

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

### Restore rollback

- Create backup or expected failure.
- Verify manifest.
- Verify checksums.
- Restore into isolated environment.
- Run integrity checks.
- Verify domain counts.
- Verify active publication or documented behavior.
- Record duration and size.

## Upgrade Matrix

### Baseline Tunarr-derived version to first migration release

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

### Each intermediate migration release

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

### Previous stable ChannelForge to current stable

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

### Previous beta to current beta

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

### Supported skipped version

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

### Unsupported skipped version

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

### Schema-compatible rollback

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

### Backup-based rollback

- Pre-upgrade backup
- Image digest recorded
- Migration result
- Readiness result
- Smoke tests
- Data validation
- Output validation
- Rollback evidence

## Security Release Gates

- Authentication required by default
- Authorization bypass suite
- Password-hash verification
- Session-cookie policy
- API-token leakage test
- Secret sentinel
- CSRF
- CORS
- Trusted proxy
- SSRF
- Upload traversal
- Archive extraction bounds
- Plugin signature and checksum
- Plugin permission denial
- FFmpeg command injection
- XML and M3U injection
- Support-bundle redaction
- Container runs without root
- Image vulnerability scan

## Performance Validation

### Catalog Sync

- Workload: 1,000, 25,000, and 100,000 items
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Catalog Search

- Workload: common filters and stable pagination
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Schedule Generation

- Workload: 1, 7, and 14-day horizons
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Multi-Channel Scheduling

- Workload: 10, 25, and 100 Channels
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### XMLTV Generation

- Workload: large guide horizon and Programme count
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### M3U Generation

- Workload: large Channel count
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Stream Startup

- Workload: direct, remux, and transcode
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Shared Fan-Out

- Workload: multiple clients on one Channel
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Concurrent Transcode

- Workload: bounded software and hardware sessions
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Backup

- Workload: large database and managed assets
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Restore

- Workload: large backup
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

### Plugin Jobs

- Workload: bounded concurrency and failure
- Runtime measured.
- Peak memory measured.
- CPU measured.
- Disk IO measured.
- Database duration measured.
- Failure threshold documented.
- Regression threshold documented.

## Reliability Validation

### 24-hour idle operation

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### 24-hour continuous playout

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Repeated client connect and disconnect

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Repeated Channel transitions

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Provider outage

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Provider credential expiration

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### FFmpeg crash

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Plugin crash

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Application restart

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Host clock adjustment

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Disk pressure

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Database busy

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Artifact regeneration failure

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Backup failure

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

### Network interruption

- Expected health state defined.
- Active publication safety verified.
- Recovery behavior verified.
- Resource cleanup verified.
- Audit and diagnostics verified.
- No silent data corruption.

## Fault Injection

### Kill application during migration

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Kill application during Catalog batch

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Kill application during plan persistence

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Kill application during publication activation

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Kill application during artifact pointer switch

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Kill FFmpeg

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Kill plugin process

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Remove provider connectivity

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Expire source token

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Fill temporary storage

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Fill durable storage

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Make database read-only

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Make backup destination unavailable

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Corrupt staged artifact

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

### Spoof forwarded headers

- Injection point documented.
- Expected transaction outcome documented.
- Expected readiness and health documented.
- Recovery verified.
- Rollback verified where applicable.
- No secret leakage.

## Flaky-Test Policy

- A flaky test is a defect.
- Do not normalize repeated reruns as success.
- Quarantine requires owner, issue, reason, and expiration.
- Authoritative gates cannot silently ignore quarantined tests.
- Randomized failures record seeds.
- Timing-sensitive tests use bounded tolerances and controlled clocks.
- Provider tests use fixtures rather than uncontrolled live servers for authority.

## Coverage Expectations

- Domain invariants have direct tests.
- Security boundaries have negative tests.
- Migration steps have prior-state fixtures.
- Compatibility routes have contract fixtures.
- Release-critical failures have reproduction tests.
- Coverage percentage alone is not release evidence.
- Uncovered critical paths require explicit justification.

## CI Pipeline

1. Repository checkout
2. Dependency integrity verification
3. License and notice checks
4. Formatting and linting
5. Type checking
6. Unit and domain tests
7. Component tests
8. API and OpenAPI contract tests
9. Security tests
10. Build application
11. Build container image
12. Run container smoke test
13. Run Linux integration suite
14. Run migration and restore suite
15. Run output and stream smoke tests
16. Run plugin suite
17. Run vulnerability scan
18. Generate SBOM
19. Publish test artifacts
20. Sign or attest release artifacts where implemented

## Release Branch and Versioning

- Semantic versioning or documented equivalent
- Release branch created from approved main revision
- Version committed once per release candidate flow
- Schema compatibility range recorded
- Migration compatibility range recorded
- Plugin API compatibility range recorded
- Release notes reference commits or PRs
- Tag is immutable
- Image digest is recorded
- Hotfix process is documented

## Release Channels

### edge

development builds without support guarantee
- Tag policy documented.
- Upgrade policy documented.
- Rollback expectations documented.
- Support scope documented.
- Telemetry or feedback policy documented.

### beta

release-candidate testing with migration caution
- Tag policy documented.
- Upgrade policy documented.
- Rollback expectations documented.
- Support scope documented.
- Telemetry or feedback policy documented.

### stable

supported production release
- Tag policy documented.
- Upgrade policy documented.
- Rollback expectations documented.
- Support scope documented.
- Telemetry or feedback policy documented.

## Release Candidate Stages

### RC0 Internal

Architecture and implementation completion check.
- Uses an immutable candidate image.
- Records image digest.
- Records test manifest.
- Records known issues.
- Requires explicit promotion decision.
- Does not silently replace prior candidate evidence.

### RC1 Migration

Fresh install and inherited Tunarr migration validation.
- Uses an immutable candidate image.
- Records image digest.
- Records test manifest.
- Records known issues.
- Requires explicit promotion decision.
- Does not silently replace prior candidate evidence.

### RC2 Runtime

Continuous playout and output-client validation.
- Uses an immutable candidate image.
- Records image digest.
- Records test manifest.
- Records known issues.
- Requires explicit promotion decision.
- Does not silently replace prior candidate evidence.

### RC3 Platform

Compose, Unraid, amd64, and optional arm64 validation.
- Uses an immutable candidate image.
- Records image digest.
- Records test manifest.
- Records known issues.
- Requires explicit promotion decision.
- Does not silently replace prior candidate evidence.

### RC4 Security

Security suite, image scan, secrets, and plugin boundaries.
- Uses an immutable candidate image.
- Records image digest.
- Records test manifest.
- Records known issues.
- Requires explicit promotion decision.
- Does not silently replace prior candidate evidence.

### RC5 Final

Documentation, release notes, checksums, and rollback rehearsal.
- Uses an immutable candidate image.
- Records image digest.
- Records test manifest.
- Records known issues.
- Requires explicit promotion decision.
- Does not silently replace prior candidate evidence.

## Release Artifact Set

- Container image
- Multi-architecture manifest where supported
- Image digest
- Source tag
- Source archive
- Checksums
- SBOM
- License and NOTICE bundle
- Docker Compose example
- Unraid template
- OpenAPI document
- Migration guide
- Upgrade guide
- Rollback guide
- Backup and restore guide
- Release notes
- Known issues
- Support matrix
- Test summary
- Security summary

## Release Notes

- Version and date
- Image tags and digest
- Supported architectures
- Supported providers and client matrix
- New features
- Behavior changes
- Breaking changes
- Migration requirements
- Backup requirement
- Upgrade steps
- Rollback limits
- Deprecated routes and settings
- Removed routes and settings
- Known issues
- Security fixes
- Plugin compatibility
- Attribution and license notes

## Release Blockers

- Failing Linux authoritative test
- Unresolved data-loss risk
- Unverified migration path
- Backup that has not been restored successfully
- Unresolved secret leakage
- Authorization bypass
- Artifact identity inconsistency
- Schedule nondeterminism
- Publication race
- Runtime corruption of approved plans
- Unbounded FFmpeg or plugin process leak
- Critical image vulnerability without accepted mitigation
- Unraid install failure
- No documented rollback
- Missing license or attribution

## Release Waiver Policy

- Waiver is exceptional.
- Waiver identifies failing gate.
- Waiver identifies user impact.
- Waiver identifies mitigation.
- Waiver identifies owner and expiration.
- Security-critical or data-loss blockers cannot be casually waived.
- Waiver appears in release notes when user-relevant.
- Waiver does not hide a failing test.

## Legacy Write Retirement

1. First-party callers removed.
2. Canonical writes verified.
3. Compatibility write metrics reach zero for supported callers.
4. Server-side freeze enabled.
5. Attempted writes produce stable error and audit.
6. Rollback window passes.
7. Legacy writer code removed in a dedicated PR.
8. Migration fixtures retain historical behavior.
9. Release notes identify removal.

## Legacy Read Retirement

1. Compatibility read usage is measured.
2. Supported external callers are migrated.
3. Support window is complete.
4. Canonical state is validated.
5. Identity mappings and tombstones are retained.
6. Backup contains legacy state.
7. Rollback no longer requires live legacy reads.
8. Compatibility reads are disabled in preview mode.
9. Removal is tested.
10. Legacy data cleanup remains a separate later step.

## Legacy State Cleanup

- Never combined with first write or read cutover.
- Requires dedicated backup.
- Requires zero-reference report.
- Requires operator confirmation.
- Preserves identity mappings and tombstones.
- Preserves audit and migration history.
- Deletes only classified obsolete state.
- Produces before-and-after counts.
- Has restore test.

## Support Windows

- Stable release support policy is documented.
- Deprecated API route window is documented.
- Legacy compatibility window is documented.
- Plugin API compatibility range is documented.
- Migration-from-old-version range is documented.
- Security hotfix policy is documented.
- End-of-support releases are identified.

## Version 1 Acceptance Scenarios

### Fresh Docker Compose installation

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Fresh Unraid installation

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Initial administrator setup

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Add Plex and synchronize

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Add Jellyfin and synchronize

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Add Emby and synchronize

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Create Network and Channel

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Generate deterministic Schedule Plan

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Approve and publish

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Consume M3U and XMLTV

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Configure HDHomeRun-compatible client

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Join live Channel in progress

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Use direct, remux, and transcode paths

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Restart container without losing state

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Create and restore backup

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Upgrade from prior supported version

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Migrate inherited Tunarr installation

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Roll back failed migration

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Install and disable a plugin

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Rotate a provider credential

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

### Collect redacted support bundle

- Documented procedure exists.
- Automated or manual test exists.
- Expected state is defined.
- Failure path is defined.
- Rollback or recovery is defined.
- Evidence is retained.

## Documentation Deliverables

Milestone 10 implementation should create:

```text
docs/implementation/release/
├── README.md
├── supported-platforms.md
├── image-build.md
├── image-tags-and-digests.md
├── ffmpeg-packaging.md
├── filesystem-layout.md
├── configuration-reference.md
├── environment-variables.md
├── secrets.md
├── docker-compose.md
├── unraid-template.md
├── networking.md
├── reverse-proxy.md
├── tls.md
├── hdhomerun-discovery.md
├── hardware-acceleration.md
├── health-checks.md
├── startup-shutdown.md
├── migration-cutover.md
├── backup.md
├── restore.md
├── upgrade.md
├── rollback.md
├── air-gapped.md
├── support-bundle.md
├── operational-runbooks.md
├── provider-support-matrix.md
├── client-support-matrix.md
├── performance-baseline.md
├── reliability-report.md
├── security-release-report.md
├── legacy-retirement.md
├── release-process.md
├── release-notes-template.md
├── known-issues-template.md
├── decision-register.md
└── completion-report.md
```
## Recommended Pull-Request Sequence

### PR 10A: Runtime Image Foundation

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10B: FFmpeg Packaging and Capability Report

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10C: Non-Root, PUID, PGID, and Groups

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10D: Filesystem and Storage Contract

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10E: Configuration and Secret Loading

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10F: Health and Startup Validation

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10G: Graceful Shutdown and Process Cleanup

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10H: Docker Compose

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10I: Unraid Template

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10J: Networking and Reverse Proxy

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10K: HDHomeRun Discovery Deployment

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10L: Intel Hardware Acceleration

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10M: NVIDIA Hardware Acceleration

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10N: Resource Limits and Temporary Storage

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10O: Backup Job

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10P: Restore Preparation and Activation

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10Q: Upgrade Compatibility

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10R: Rollback Workflow

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10S: Migration Cutover Orchestrator

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10T: Legacy Write Freeze and Removal

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10U: Legacy Read Support Window

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10V: Support Bundle

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10W: Operational Runbooks

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10X: Linux Release Suite

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10Y: Windows Development Suite

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10Z: Provider Compatibility Matrix

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AA: Output and Client Compatibility Matrix

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AB: Migration Fixture Matrix

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AC: Backup and Restore Matrix

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AD: Performance Baseline

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AE: Reliability and Fault Injection

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AF: Security Release Gates

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AG: Multi-Architecture Build

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AH: SBOM, Checksums, and Provenance

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AI: Release Candidate Automation

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AJ: Release Documentation

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

### PR 10AK: Completion Report

- One bounded deployment or release concern
- Architecture and module impact
- Container-image impact
- Persistent-state impact
- Migration impact
- Security impact
- Platform impact
- Compatibility impact
- Tests
- Rollback

## Pull-Request Prohibitions

- Do not combine image redesign with scheduling semantics.
- Do not combine Unraid template work with unrelated UI redesign.
- Do not combine migration cutover with legacy table deletion.
- Do not combine backup implementation with destructive restore activation.
- Do not combine hardware acceleration with arbitrary FFmpeg command support.
- Do not combine release versioning with broad dependency upgrades.
- Do not combine legacy write removal with legacy read removal.
- Do not combine security-waiver decisions with hidden test exclusions.
- Do not combine release documentation with unexplained behavior changes.
- Do not combine arm64 declaration with unvalidated support.

## Entry Gates

1. Milestones 01 through 09 are documented.
2. Module boundaries are implemented or accepted for implementation.
3. Persistence and migration infrastructure exist.
4. Compatibility modes exist.
5. Media Sources and Catalog are canonical.
6. Networks and Channels are canonical.
7. Deterministic scheduling exists.
8. Publication and playout exist.
9. API and UI migration is substantially complete.
10. Authentication, authorization, and Secret Service exist.
11. Plugin boundaries exist.
12. OpenAPI exists.
13. Legacy route usage is measured.
14. Current Docker behavior is inventoried.
15. Current Unraid behavior is inventoried.
16. Build passes.
17. Linux test baseline exists.
18. Windows failures are classified.
19. No unresolved critical data-loss risk blocks release work.

## Completion Gates

1. Official container image exists.
2. Image is multi-stage.
3. Runtime image excludes unnecessary build tools.
4. Version and revision metadata exist.
5. Release tag and digest exist.
6. FFmpeg version is predictable.
7. FFmpeg capability report exists.
8. Image runs non-root where practical.
9. PUID and PGID are supported.
10. Supplemental groups are supported.
11. Managed paths are documented.
12. Durable state survives container recreation.
13. Temporary storage is bounded.
14. SQLite storage is validated.
15. Unsupported storage is rejected or warned.
16. Configuration precedence is documented.
17. Environment variables are documented.
18. Secret loading is secure.
19. Docker Compose exists.
20. Compose smoke test passes.
21. Unraid template exists.
22. Unraid installation passes.
23. Bridge networking works.
24. Host networking is optional.
25. Reverse-proxy configuration works.
26. Trusted-proxy policy works.
27. TLS guidance exists.
28. HDHomeRun HTTP discovery works.
29. HDHomeRun UDP deployment is documented and tested where supported.
30. Intel hardware acceleration is documented and tested where supported.
31. NVIDIA hardware acceleration is documented and tested where supported.
32. Software fallback exists.
33. CPU and memory baselines exist.
34. Health distinguishes liveness and readiness.
35. Detailed authenticated health exists.
36. Startup validation exists.
37. Graceful shutdown exists.
38. Child-process cleanup exists.
39. Migration backup gate exists.
40. Migration resume exists.
41. Migration rollback exists.
42. Migration conflicts are operator-visible.
43. Migration validation report exists.
44. Backup Job exists.
45. Backup checksums exist.
46. A release backup has been restored successfully.
47. Restore preview exists.
48. Restore rollback exists.
49. Upgrade guide exists.
50. Upgrade matrix passes.
51. Downgrade incompatibility is blocked.
52. Rollback guide exists.
53. Air-gapped procedure exists.
54. Structured logging exists.
55. Support bundle exists.
56. Support bundle redaction passes.
57. Operational runbooks exist.
58. Linux authoritative suite passes.
59. Windows development suite passes or classified failures remain.
60. amd64 image passes.
61. arm64 is either validated or explicitly unsupported.
62. Plex matrix passes.
63. Jellyfin matrix passes.
64. Emby matrix passes.
65. XMLTV validation passes.
66. M3U validation passes.
67. HDHomeRun-compatible validation passes.
68. Plex client workflow passes or limitations are documented.
69. Jellyfin client workflow passes or limitations are documented.
70. Emby client workflow passes or limitations are documented.
71. Scheduling determinism passes.
72. Migration fixtures pass.
73. Backup and restore matrix passes.
74. Security release gates pass.
75. Performance baseline exists.
76. Reliability run exists.
77. Fault-injection suite passes.
78. No unowned flaky release test exists.
79. SBOM exists where practical.
80. Checksums exist.
81. License and NOTICE bundle exists.
82. Tunarr attribution remains.
83. Release notes exist.
84. Known issues exist.
85. Support matrix exists.
86. Legacy writes are frozen.
87. Legacy writer removal criteria are met.
88. Legacy read support window is defined.
89. Legacy cleanup remains separate.
90. Release blocker review is complete.
91. Rollback rehearsal is complete.
92. Final release candidate is approved.
93. Version 1 completion report exists.

## Completion Evidence

- Image tag and digest
- Git revision
- SBOM reference
- License and notice verification
- FFmpeg version and capabilities
- Container user and group report
- Storage-layout report
- Compose result
- Unraid result
- Networking result
- Reverse-proxy result
- HDHomeRun discovery result
- Hardware acceleration result
- Health-check result
- Startup and shutdown result
- Migration report
- Backup and restore report
- Upgrade and rollback report
- Linux test manifest
- Windows test manifest
- Provider matrix
- Client matrix
- Output validation
- Determinism checksums
- Security report
- Performance report
- Reliability report
- Fault-injection report
- Legacy retirement report
- Release notes
- Known issues
- Open risks

## Rollback

### Image

Retain prior exact tag and digest.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Schema

Use supported downgrade only or restore pre-upgrade backup.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Migration

Return authority to prior phase and reconcile temporary writes.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Publication

Activate prior valid publication.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Artifacts

Restore prior Output Publication Set.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Runtime

Route new sessions to prior compatible handler.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Plugins

Disable or restore prior package and state.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Configuration

Restore prior validated snapshot.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Unraid

Select prior image tag without deleting `/config`.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

### Compose

Restore prior Compose file and image digest.
- Prerequisites documented.
- Data compatibility verified.
- Operator steps documented.
- Verification documented.
- Audit recorded.

## Failure Handling

### Image pull failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Container startup failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Migration failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Database corruption

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Disk full

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Secret key missing

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### FFmpeg missing

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Hardware device unavailable

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Provider unavailable

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Artifact generation failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Plugin integrity failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Backup failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Restore failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Rollback failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### UDP discovery failure

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

### Reverse-proxy misconfiguration

- Readiness behavior is explicit.
- Existing durable state is preserved.
- Existing active publication is preserved where possible.
- Actionable diagnostics are produced.
- Secrets remain redacted.
- Recovery and rollback procedures exist.

## Risks

### Unsupported SQLite Filesystem

Network storage may violate locking or atomicity assumptions.

Mitigation:
- Validate storage
- document local requirement
- block unsafe mode

### Container Permission Drift

UID or GID mismatch may make durable state unavailable.

Mitigation:
- Startup checks
- PUID/PGID docs
- managed-path-only ownership

### FFmpeg Version Drift

Image updates may change codecs or behavior.

Mitigation:
- Pin version
- capability report
- release fixtures

### GPU Driver Drift

Host drivers may not match container expectations.

Mitigation:
- Support matrix
- startup report
- software fallback

### Migration Data Loss

Legacy state may be transformed incorrectly.

Mitigation:
- Backup
- fixtures
- conflicts
- rollback

### Ambiguous Authority

Legacy and ChannelForge writers may diverge.

Mitigation:
- Ownership matrix
- write freeze
- metrics

### Restore Failure

A backup may be unusable.

Mitigation:
- Restore tests
- manifest checksums
- compatibility checks

### Floating Image Tags

Operator cannot reproduce previous deployment.

Mitigation:
- Digest recording
- exact-tag guidance
- rollback docs

### UDP Discovery

Docker networking may prevent broadcast.

Mitigation:
- HTTP discovery
- host-network option
- manual configuration

### Resource Exhaustion

Transcode, plugin, or guide workloads may exhaust host.

Mitigation:
- limits
- metrics
- load tests

### Large XMLTV

Artifact generation may consume excessive memory.

Mitigation:
- streaming generation
- bounds
- performance tests

### Plugin Supply Chain

Malicious package may enter release deployment.

Mitigation:
- signatures
- trust policy
- quarantine

### Unraid Template Drift

Template may diverge from Compose and image requirements.

Mitigation:
- shared config reference
- install test
- versioned template

### Legacy Removal Too Early

Unknown clients or automation may break.

Mitigation:
- usage metrics
- support window
- release notes

### Release Evidence Gaps

A passing build may hide missing operational proof.

Mitigation:
- completion report
- release checklist
- blockers

## Milestone Invariants

1. The container image is replaceable.
2. Durable state is mounted outside the image.
3. SQLite uses supported local storage.
4. Container recreation preserves editorial state.
5. Startup validates before readiness.
6. Migrations are backed up.
7. Migrations are deterministic.
8. Migrations are restart-safe.
9. Only one write authority exists per concept.
10. Migration conflicts are not guessed.
11. Legacy identifiers remain mappings.
12. Legacy writes freeze before removal.
13. Legacy read removal follows a support window.
14. Legacy cleanup is a separate destructive step.
15. Backups are proven by restore.
16. Restore does not silently overwrite active state.
17. Unsupported downgrade is blocked.
18. Rollback references an exact image.
19. Release images contain version metadata.
20. FFmpeg availability is predictable.
21. Non-root execution is supported.
22. PUID and PGID changes affect managed paths only.
23. Public access is disabled by default.
24. Host networking is optional.
25. Trusted proxies are explicit.
26. HDHomeRun discovery does not redefine Channel identity.
27. Hardware access is explicit.
28. Resource use is bounded.
29. Liveness and readiness are distinct.
30. Support bundles redact secrets.
31. Linux is production authority.
32. Windows remains a development environment.
33. A failing authoritative test blocks release.
34. Flaky tests are defects.
35. Time and randomness are controlled in deterministic tests.
36. Golden changes require semantic review.
37. Provider fixtures are versioned.
38. Real-provider tests are supplemental.
39. Output artifacts are validated.
40. Last-known-good artifacts survive failed regeneration.
41. Approved Schedule Plans remain immutable.
42. Runtime recovery does not rewrite plans.
43. Security boundaries have negative tests.
44. Plugins remain bounded.
45. Release artifacts include licenses and notices.
46. Tunarr attribution remains intact.
47. Release notes identify migration and rollback.
48. Known issues are visible.
49. Release blockers are explicit.
50. Waivers are attributable and expiring.
51. Version 1 is complete only when release evidence is complete.

## Deferred Decisions

- Exact container registry
- Exact image repository name
- Exact base image
- Exact FFmpeg distribution
- Exact SBOM format
- Exact artifact signing mechanism
- Exact release attestation mechanism
- Exact arm64 support date
- Exact Compose version syntax
- Exact Unraid Community Applications publication process
- Exact default ports
- Exact persistent-directory names
- Exact environment-variable prefix
- Exact Secret Service key-file format
- Exact backup archive format
- Exact backup encryption algorithm
- Exact backup retention defaults
- Exact restore UI
- Exact upgrade support range
- Exact rollback support window
- Exact legacy read support duration
- Exact stable release cadence
- Exact beta cadence
- Exact vulnerability severity threshold
- Exact performance thresholds
- Exact reliability soak duration
- Exact client-version support matrix
- Exact telemetry policy
- Exact support-bundle retention
- Kubernetes
- Distributed playout
- External database support
- High availability

## Roadmap Completion

Completion of Milestone 10 means:

- All ten implementation roadmap documents exist.
- The dependency sequence is complete.
- Architecture specifications have an implementation path.
- Version 1 release gates are explicit.
- Migration and rollback responsibilities are explicit.
- Runtime, security, deployment, and support expectations are explicit.
- Legacy retirement is governed by evidence rather than convenience.
- Runtime implementation may proceed through the approved PR sequence.

The implementation roadmap branch may then be reviewed as one documentation
package and merged into `main` through a regular pull request.
