<div align="center">

# ChannelForge

**Build television networks, not playlists.**

An open-source, self-hosted platform for designing, scheduling, and publishing virtual television networks.

[Architecture](docs/architecture/README.md) ·
[Implementation Roadmap](docs/implementation/README.md) ·
[Project Notices](NOTICE.md) ·
[Contributing](CONTRIBUTING.md)

![Project status](https://img.shields.io/badge/status-foundation%20in%20progress-8a6d3b)
![License](https://img.shields.io/badge/license-zlib-4c8c72)
![Node.js](https://img.shields.io/badge/node.js-22-43853d)
![pnpm](https://img.shields.io/badge/pnpm-10.28.0-f69220)

</div>

---

> [!IMPORTANT]
> ChannelForge is in active foundation development. It is not yet a stable
> end-user release, and there is no official ChannelForge container image or
> installation package.
>
> The repository currently retains substantial inherited Tunarr runtime code,
> package names, terminology, and interface elements while the transition is
> performed incrementally.

## What is ChannelForge?

ChannelForge is a network-first virtual television system for self-hosted media
libraries.

Instead of treating a channel as a manually ordered playlist, ChannelForge is
designed around the identity and programming strategy of a television network.
A network can define its audience, editorial profile, dayparts, programming
blocks, constraints, interstitial rules, and scheduling preferences.
ChannelForge then produces a deterministic and explainable schedule from those
inputs.

The planned runtime publishes compatible television outputs for media servers
and IPTV clients while keeping schedule planning separate from live playout.

## Product direction

ChannelForge is being built around these principles:

- **Network-first programming:** networks, channels, dayparts, blocks, profiles,
  and programming rules are first-class concepts.
- **Deterministic scheduling:** the same inputs and seed must produce the same
  plan, with evidence explaining each decision.
- **Planning and playout separation:** schedule generation does not directly
  control stream execution.
- **Provider-independent catalog:** Plex, Jellyfin, Emby, and local media are
  normalized behind explicit adapters.
- **Controlled constraints:** hard rules cannot be silently overridden by
  weighted preferences.
- **Local-first deployment:** Docker Compose is the canonical deployment model,
  with Unraid supported as a wrapper around the same container contract.
- **Incremental migration:** the inherited runtime remains buildable while
  ChannelForge-owned boundaries replace legacy concepts in controlled stages.
- **Explicit security boundaries:** plugins, external feeds, secrets, database
  access, and process execution must use defined capabilities.

## Current repository state

ChannelForge uses portions of the mature Tunarr runtime as its implementation
foundation. This avoids rebuilding proven virtual television infrastructure
before the ChannelForge domain model is ready.

### Inherited runtime capabilities currently present

- Plex, Jellyfin, and Emby integrations
- Local media-library support
- Existing channel and lineup editing
- Existing time-slot and random-slot scheduling
- Filler and flex programming behavior
- FFmpeg-based playback and transcoding
- Stream-session management
- XMLTV guide generation
- M3U/IPTV output
- HDHomeRun-compatible endpoints
- Browser-based management interface
- Docker deployment infrastructure
- SQLite, Kysely, Drizzle, Better SQLite3, and LowDB persistence layers

These capabilities describe the current inherited baseline. They are not a
claim that the final ChannelForge architecture has already been implemented.

### ChannelForge implementation status

| Area | Status |
| --- | --- |
| Product mission and terminology | Defined |
| Architecture specifications and ADRs | Documented; individual documents retain their recorded status |
| Implementation roadmap | Draft |
| Milestone 01: baseline and change control | In progress |
| Baseline capture framework | Merged |
| Repository and toolchain inventory | Merged |
| Persistence and API inventory | Merged |
| Provider, scheduling, and playout inventory | Next |
| Stable ChannelForge end-user release | Not available |

Milestone status and implementation sequencing are tracked in
[`docs/implementation/`](docs/implementation/).

## Planned version 1 scope

The first credible ChannelForge implementation baseline is intended to include:

- Stable ChannelForge identities and module boundaries
- Controlled compatibility with inherited Tunarr data and routes
- Normalized Media Sources, Catalog Items, Source Bindings, and Playback Variants
- Networks, Channels, editorial profiles, audience profiles, and revisions
- Presentation Assets and network- or channel-scoped Interstitial Pools
- Dayparts, programming blocks, templates, and programming configuration
- Deterministic schedule planning with validation and decision evidence
- Schedule approval, publication, and active-plan selection
- Runtime playout integration and fallback decisions
- XMLTV, M3U/IPTV, and HDHomeRun-compatible publication
- First-party API and UI migration
- Authentication, authorization, audit, and secret-handling boundaries
- Plugin contract scaffolding
- Docker Compose and Unraid validation
- Migration, backup, restore, rollback, and release-readiness gates

The roadmap intentionally excludes a big-bang rewrite, PostgreSQL migration,
distributed microservices, a hosted control plane, and a public SaaS platform
from version 1.

## Interstitial programming and external feeds

ChannelForge treats commercials, station IDs, bumpers, promos, prerolls,
short-form segments, and similar material as structured interstitial
programming rather than anonymous filler.

External video feeds are discovery sources, not automatically playable linear
media. A discovered item may enter scheduling or playout only when a separately
supported and authorized playable source exists.

Version 1 does **not** include:

- YouTube downloading
- YouTube stream extraction
- YouTube-to-FFmpeg restreaming
- BumpWorthy scraping or downloading
- Arbitrary webpage-to-media conversion

See
[`ADR 0002`](docs/architecture/adr/0002-interstitial-programming-and-external-video-feeds.md)
and
[`Specification 15`](docs/architecture/spec/15-interstitial-programming-and-external-video-feeds.md)
for the governing rules.

## Installation

There is currently no supported ChannelForge release, Docker image, Unraid
Community Application, or standalone binary.

The inherited Tunarr deployment instructions are intentionally not presented as
ChannelForge installation instructions. Installation documentation will be
published after the ChannelForge container identity, migration behavior,
configuration paths, and release gates are validated.

## Development

### Requirements

- Node.js 22
- pnpm 10.28.0
- Git
- FFmpeg for runtime media testing
- Docker for production-like deployment validation

### Local setup

```bash
pnpm install
pnpm build
pnpm turbo dev
```

The development server currently uses inherited runtime defaults:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173/web`

Run the baseline capture tests with:

```bash
pnpm baseline:test
```

The inherited full test suite has known Windows-specific path and SQLite file
locking failures. Production behavior is validated in Linux, while Windows
failures remain tracked and must be classified rather than dismissed.

## Repository layout

| Path | Purpose |
| --- | --- |
| `server/` | Fastify API, persistence, providers, scheduling, playout, and background tasks |
| `web/` | First-party React management interface |
| `types/` | Shared schemas, API types, and provider contracts |
| `shared/` | Shared utilities |
| `docs/architecture/` | ChannelForge architecture, specifications, and ADRs |
| `docs/implementation/` | Milestone roadmap and implementation gates |
| `docs/implementation/baseline/` | Reviewed Milestone 01 evidence |
| `scripts/implementation-baseline/` | Deterministic baseline capture tooling |
| `LICENSES/` | Preserved third-party and inherited license notices |

## Documentation

Start with:

1. [Architecture overview](docs/architecture/README.md)
2. [Architecture specifications](docs/architecture/spec/README.md)
3. [Architecture Decision Records](docs/architecture/adr/)
4. [Implementation roadmap](docs/implementation/README.md)
5. [Milestone 01 baseline evidence](docs/implementation/baseline/README.md)
6. [Project notices and attribution](NOTICE.md)

## Contributing

ChannelForge uses narrow, reviewable pull requests that preserve a buildable
`main` branch.

Before changing runtime behavior:

- Identify the governing architecture and milestone documents.
- Characterize inherited behavior before replacing it.
- Keep one documented write authority per concept.
- Preserve migration and rollback paths.
- Avoid unrelated dependency updates, broad formatting churn, and opportunistic
  renaming.
- Include tests or evidence appropriate to the boundary being changed.

See [CONTRIBUTING.md](CONTRIBUTING.md) for inherited development instructions.
Some terminology in that document remains Tunarr-derived and will be migrated
in a later controlled documentation pass.

## Attribution

ChannelForge is an independent open-source virtual television project derived
in part from the Tunarr codebase.

The original Tunarr code is distributed under the zlib License. ChannelForge
preserves the inherited Git history and retains a copy of the original license
at [`LICENSES/tunarr-zlib.txt`](LICENSES/tunarr-zlib.txt).

ChannelForge has its own product direction and is not represented as the
original Tunarr software or as work authored entirely by the ChannelForge
maintainers. See [NOTICE.md](NOTICE.md) for the full attribution statement.

## License

The repository is currently distributed under the
[zlib License](LICENSE), including the requirements to preserve origin,
identify altered source versions, and retain the license notice.
