# Milestone 01 Security and Deployment Baseline Closure

- **Status:** Closed for Milestone 01 inventory scope
- **Final security implementation:** Deferred to Milestone 09
- **Release deployment validation:** Deferred to Milestone 10
- **Runtime behavior changed:** No

## Security Baseline

Milestone 01 establishes an inventory-level security baseline. It does not claim
that the inherited runtime implements the final ChannelForge security model.

### Reviewed Evidence

- `persistence-inventory.md`
- `persistence-write-authority.md`
- `configuration-filesystem-inventory.md`
- `provider-catalog-inventory.md`
- `api-inventory.md`
- `openapi-inventory.md`
- `background-runtime-inventory.md`
- `scripts/implementation-baseline/lib/redaction.mjs`
- Provider request redacters for Plex, Jellyfin, and Emby
- `docs/architecture/spec/11-security.md`
- `docs/implementation/09-api-ui-security-and-plugins.md`

### Current Controls and Authorities

| Area | Milestone 01 disposition |
| --- | --- |
| Provider credentials | Storage and configuration surfaces are inventoried; values were not collected |
| Request redaction | Provider-specific request redacters and a shared redaction boundary are present |
| Evidence redaction | Baseline collectors redact recognized secret-bearing keys and secret-like text |
| Secret sentinel approach | Baseline utility tests verify recursive key redaction and embedded secret-like value redaction |
| API and OpenAPI surface | Current routes and generated-client authority are inventoried |
| Filesystem and persistence | Durable paths and write authorities are inventoried |
| Environment values | Excluded from generated evidence |
| Provider calls | Not performed during evidence collection |
| Final authentication and authorization | Deferred to Milestone 09 |
| Final Secret Service, audit, CSRF, SSRF, and security-header policy | Deferred to Milestone 09 |
| Runtime penetration, abuse, and release-security validation | Deferred to Milestone 10 |

### Security Gate Decision

Completion gate 28 is met at the required Milestone 01 level:

- Current controls and credential-bearing surfaces are identified.
- Evidence collection is secret-safe.
- Unknown and incomplete controls remain explicit.
- Final security implementation is not falsely claimed.
- Milestone 02 is prohibited from inventing a competing security authority while
  defining module boundaries.

## Deployment Baseline

### Reviewed Deployment Paths

| Path or mechanism | Purpose |
| --- | --- |
| `Dockerfile` | Primary inherited container build |
| `docker/dev.compose.yaml` | Development composition |
| `docker/example.compose.yaml` | Example deployment composition |
| `docker/docs.Dockerfile` | Documentation container build |
| `.github/workflows/build-and-push-docker.yml` | Container build and publication path |
| `.github/workflows/build-and-release-binary.yml` | Standalone binary build and publication path |
| `.github/workflows/main.yml` | Inherited Linux build validation |
| `.github/workflows/m01-linux-baseline.yml` | Exact-toolchain authoritative Linux baseline |

The provider, playout, background-runtime, configuration, and filesystem
inventories identify FFmpeg, output, persistent data, temporary data, and
process boundaries relevant to deployment.

### Validation Performed

- Frozen dependency installation on GitHub-hosted Linux
- Exact Node.js and pnpm version checks
- Full build
- Full inherited test suite
- Repository-cleanliness enforcement
- Existing PR build workflow
- Commit-message and message-extraction checks

### Runtime Deployment Work Not Performed

The local Docker command was installed but the Docker Desktop Linux engine was
not running. The only registered WSL distribution was `docker-desktop`.
Therefore Milestone 01 did not claim container-runtime validation for:

- Empty-instance startup
- Liveness and readiness
- Graceful stop and restart
- Data preservation
- Media-mount reads
- Hardware-device passthrough
- XMLTV or M3U generation inside a container
- Starting a live stream
- Unraid template installation

Those release-level validations remain assigned to Milestone 10.

### Deployment Gate Decision

Completion gate 26 is met because deployment paths, build mechanisms, runtime
dependencies, persistent paths, and deferred validation are explicitly
inventoried.

The missing container-runtime exercise does not block Milestone 02 because
Milestone 02 defines module boundaries and is prohibited from changing
deployment semantics. It remains a release blocker for Milestone 10.

## Closure Decision

Security and deployment are closed only for Milestone 01 baseline purposes.
They remain active implementation and release concerns in Milestones 09 and 10.
