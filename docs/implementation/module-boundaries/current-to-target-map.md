# Milestone 02 Current-to-Target Map

- **Status:** Accepted
- **Scope:** Representative inherited architectural surfaces

| Current path | Current responsibility | Target boundary | Migration strategy | Risk | Owner |
| --- | --- | --- | --- | --- | --- |
| `server/src/App.ts / Server.ts / container.ts` | Inherited application composition and process host | Application host / composition | Migrate composition incrementally around public module interfaces | High | Application host |
| `server/src/api/**` | Inherited Fastify/API transport | Transport + module application interfaces | Retain routes, then redirect orchestration through public application services | High | Transport |
| `server/src/db/**` | Inherited SQLite access and legacy repositories | Module-owned repository ports + SQLite adapters | Introduce ChannelForge persistence additively in M03; do not move tables in M02 | High | Owning business module |
| `server/src/external/**` | Inherited provider and external integrations | Media Sources/provider adapters or infrastructure | Wrap provider-specific behavior behind normalized ports before cutover | High | Media Sources |
| `server/src/services/scanner/**` | Inherited media-source scanning and catalog-like synchronization | Media Sources + Catalog | Continue through compatibility synchronization boundary; split normalization and persistence later | High | Media Sources / Catalog |
| `server/src/ffmpeg/**` | Inherited FFmpeg planning and execution | Playout adapter + process infrastructure | Wrap process execution behind `StreamProcessRunner` before runtime cutover | High | Playout |
| `server/src/migration/**` | Inherited schema/data migration implementation | Migration coordination + persistence infrastructure | Retain implementation until M03/M04 migration authority is introduced | High | Migration |
| `shared/src/**` | Inherited shared utilities and contracts | Minimal shared kernel or owning module | Use classified kernel entry point; migrate feature concepts out incrementally | Medium | Shared kernel / owning module |
| `types/src/**` | Inherited API, provider, and schema types | Public contracts or adapter-local provider types | Use governed public-contract entry point; contain provider DTOs | Medium | Contracts / Media Sources |
| `web/src/**` | Inherited first-party browser application | Web client using public contracts/generated client boundary | Block server-internal imports now; migrate API usage in M09 | Medium | Web |
| `server/src/compatibility/tunarr/**` | Anti-corruption layer for inherited Tunarr behavior | Temporary compatibility boundary | Measure use, replace implementations incrementally, then retire | Medium | Migration |
| `server/src/modules/**` | ChannelForge modular-monolith public boundaries | Canonical business modules | Strict enforcement; add behavior only through owned public interfaces | Low | Individual modules |

## Interpretation

This is a migration-ownership map, not a declaration that inherited code has
already moved.

Milestone 02 establishes the target boundaries and no-regression rules.
Milestones 03 through 09 perform persistence, compatibility, domain, runtime,
API, and UI cutovers incrementally.
