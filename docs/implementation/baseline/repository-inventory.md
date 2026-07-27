# Repository Inventory

- **Source commit:** `195a4d04aca082af04362152f56283c139e9eaad`
- **Source commit date:** `2026-07-26T22:18:58-07:00`
- **Capture framework:** `schemaVersion 1`

## Repository Identity

| Field | Value |
| --- | --- |
| Repository | `BMJ812/ChannelForge` |
| Origin | `https://github.com/BMJ812/ChannelForge.git` |
| Capture branch | `docs/m01-repository-toolchain-inventory` |
| Source state clean | `True` |
| Root package | `tunarr` |
| Root version | `1.2.0-dev.1` |
| License | `Zlib` |
| Module type | `module` |
| Node engine | `22` |
| Package manager | `pnpm@10.28.0` |

The root package identity is inherited Tunarr state. Milestone 01 records it
without renaming it.

## Workspace Membership

| Path | Package | Purpose |
| --- | --- | --- |
| `.` | `tunarr` | Monorepo orchestration and inherited release metadata |
| `server` | `@tunarr/server` | Inherited Fastify runtime, persistence, providers, scheduling, playout, and output |
| `shared` | `@tunarr/shared` | Shared utilities, constants, validation, search helpers, and randomness helpers |
| `types` | `@tunarr/types` | Shared schemas, provider contracts, and application API types |
| `web` | `@tunarr/web` | First-party React web interface and generated API client consumer |

## Root Package Scripts

| Script | Command |
| --- | --- |
| `baseline:capture` | `node scripts/implementation-baseline/capture.mjs all` |
| `baseline:test` | `node --test scripts/implementation-baseline/test/baseline-utils.test.mjs scripts/implementation-baseline/test/capture.test.mjs` |
| `build` | `turbo run build` |
| `dev` | `turbo run dev` |
| `fmt` | `prettier --write .` |
| `generate-docs-script` | `tsx scripts/generate-docs-script.ts` |
| `knip` | `knip` |
| `lint-changed` | `eslint --fix $(git diff --name-only HEAD -- './**/*.ts*' \| xargs)` |
| `lint-staged` | `lint-staged --allow-empty` |
| `preinstall` | `npx only-allow pnpm` |
| `should-semantic-release` | `should-semantic-release --verbose` |
| `test` | `turbo run test` |

## Turbo Task Graph

| Task | Depends on | Outputs | Cache | Persistent | Interruptible |
| --- | --- | --- | --- | --- | --- |
| `build` | `^build` | `build/**, dist/**` | `True` | `False` | `False` |
| `build-dev` | â€” | â€” | `True` | `False` | `False` |
| `clean` | â€” | â€” | `False` | `False` | `False` |
| `dev` | `@tunarr/types#build, @tunarr/shared#build` | â€” | `False` | `True` | `True` |
| `lint` | â€” | â€” | `True` | `False` | `False` |
| `lint-fix` | â€” | â€” | `True` | `False` | `False` |
| `test` | â€” | â€” | `False` | `False` | `False` |
| `test:watch` | â€” | â€” | `False` | `True` | `False` |
| `topo` | `^topo` | â€” | `True` | `False` | `False` |

## Root Configuration Files

- `.dockerignore`
- `.gitignore`
- `.prettierignore`
- `.prettierrc`
- `.release-it.json`
- `commitlint.config.ts`
- `Dockerfile`
- `eslint.config.mjs`
- `LICENSE`
- `NOTICE.md`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `release.config.mjs`
- `tsconfig.json`
- `turbo.json`
- `vitest.config.ts`

## Findings

- The repository is a pnpm monorepo with four inherited workspace packages.
- Turbo orchestrates build, development, lint, and test tasks.
- The development task explicitly builds `@tunarr/types` and
  `@tunarr/shared` before starting dependent development tasks.
- The root package remains named `tunarr`; renaming is outside Milestone 01.
- This inventory records structure only and does not assert final
  ChannelForge module ownership.
