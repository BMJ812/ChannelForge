# Milestone 02 Module Ownership

- **Status:** Accepted
- **Milestone:** 02 - Module Boundaries
- **Canonical modules:** 17

| Concept / capability | Owning module | Public boundary | Persistence owner | Migration owner |
| --- | --- | --- | --- | --- |
| Management identity and authorization | Access | `modules/access/index.ts` | Access | Access + Migration |
| Installation identity and settings | Instance | `modules/instance/index.ts` | Instance | Instance + Migration |
| External media-server connections | Media Sources | `modules/media-sources/index.ts` | Media Sources | Media Sources + Migration |
| Normalized programmable media | Catalog | `modules/catalog/index.ts` | Catalog | Catalog + Migration |
| Editorial Network identity | Networks | `modules/networks/index.ts` | Networks | Networks + Migration |
| Canonical tuneable Channel identity | Channels | `modules/channels/index.ts` | Channels | Channels + Migration |
| Reusable presentation configuration | Branding | `modules/branding/index.ts` | Branding | Branding + Migration |
| Editorial programming revisions | Programming | `modules/programming/index.ts` | Programming | Programming + Migration |
| Deterministic Schedule Plans | Scheduling | `modules/scheduling/index.ts` | Scheduling | Scheduling + Migration |
| Active approved-plan selection | Publication | `modules/publication/index.ts` | Publication | Publication + Migration |
| Runtime playback decisions and sessions | Playout | `modules/playout/index.ts` | Playout | Playout + Migration |
| Guide, playlist, device, and stream-route presentation | Output | `modules/output/index.ts` | Output | Output + Migration |
| Reusable templates and programming packs | Templates | `modules/templates/index.ts` | Templates | Templates + Migration |
| Business health and recommendations | Health | `modules/health/index.ts` | Health | Health + Migration |
| Background execution state | Jobs | `modules/jobs/index.ts` | Jobs | Jobs + Migration |
| Plugin registration and capability grants | Plugins | `modules/plugins/index.ts` | Plugins | Plugins + Migration |
| Legacy transition coordination and evidence | Migration | `modules/migration/index.ts` | Migration | Migration |

## Ownership Rules

Persistence implementation is not migrated by Milestone 02.

The table records target authority so Milestone 03 and later work can introduce
repositories without re-deciding aggregate ownership.

Cross-module callers use public module entry points and stable identifiers.
Compatibility implementations remain outside the business modules under the
Tunarr compatibility boundary.
