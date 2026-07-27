# Workspace Inventory

- **Source commit:** `195a4d04aca082af04362152f56283c139e9eaad`
- **Workspace declaration:** `pnpm-workspace.yaml`
- **Workspace patterns:** `server`, `shared`, `types`, `web`

## Package Summary

| Path | Current name | Current purpose | Direct workspace dependencies | Build command | Test command |
| --- | --- | --- | --- | --- | --- |
| `.` | `tunarr` | Monorepo orchestration and inherited release metadata | â€” | `turbo run build` | `turbo run test` |
| `server` | `@tunarr/server` | Inherited Fastify runtime, persistence, providers, scheduling, playout, and output | `@tunarr/shared, @tunarr/types` | `cross-env NODE_OPTIONS=--max-old-space-size=8192 tsgo -p tsconfig.build.json` | `vitest --typecheck.tsconfig tsconfig.test.json --run` |
| `shared` | `@tunarr/shared` | Shared utilities, constants, validation, search helpers, and randomness helpers | `@tunarr/types` | `tsgo --declaration` | `vitest --run` |
| `types` | `@tunarr/types` | Shared schemas, provider contracts, and application API types | â€” | `tsgo --declaration` | â€” |
| `web` | `@tunarr/web` | First-party React web interface and generated API client consumer | `@tunarr/shared, @tunarr/types` | `tsgo -p tsconfig.build.json --noEmit` | `vitest --run` |

## `tunarr`

| Field | Value |
| --- | --- |
| Path | `.` |
| Version | `1.2.0-dev.1` |
| Private | `False` |
| License | `Zlib` |
| Type | `module` |
| Main | â€” |
| Binary | â€” |

### Scripts

| Name | Command |
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

## `@tunarr/server`

| Field | Value |
| --- | --- |
| Path | `server` |
| Version | `1.2.0-dev.1` |
| Private | `True` |
| License | `Zlib` |
| Type | `module` |
| Main | `src/index.ts` |
| Binary | `dist/bundle.cjs` |

### Scripts

| Name | Command |
| --- | --- |
| `build` | `cross-env NODE_OPTIONS=--max-old-space-size=8192 tsgo -p tsconfig.build.json` |
| `build-dev` | `cross-env NODE_ENV=development NODE_OPTIONS=--max-old-space-size=8192 tsgo -p tsconfig.build.json --noEmit --watch` |
| `bundle` | `dotenvx run -- tsx scripts/bundle.ts` |
| `clean` | `rimraf --glob ./build/ ./dist/ ./bin/*` |
| `debug` | `cross-env NODE_ENV=development dotenvx run -f .env.development -- tsx watch --trace-warnings --tsconfig ./tsconfig.build.json --ignore 'src/streams' --inspect-wait ./src` |
| `dev` | `cross-env NODE_ENV=development dotenvx run -f .env.development -- tsx watch --heap-snapshot-on-oom --trace-warnings --tsconfig ./tsconfig.build.json --ignore 'build' --ignore 'src/streams' --ignore 'src/**/*.test.ts' ./src/index.ts` |
| `generate-env` | `tsx scripts/generateEnvModule.ts` |
| `generate-openapi` | `tsx src/index.ts generate-openapi` |
| `install-meilisearch` | `tsx scripts/download-meilisearch.ts` |
| `kysely` | `dotenv -e .env.development -- kysely` |
| `lint` | `eslint . --report-unused-disable-directives --max-warnings 0` |
| `make-bin` | `dotenvx run -- tsx scripts/make-bin.ts` |
| `predev` | `tsx scripts/generateEnvModule.ts` |
| `preinstall` | `npx only-allow pnpm` |
| `run-fixer` | `dotenv -e .env.development -- tsx src/index.ts fixer` |
| `test` | `vitest --typecheck.tsconfig tsconfig.test.json --run` |
| `test:local` | `vitest --config vitest.local.config.ts --typecheck.tsconfig tsconfig.test.json --run` |
| `test:watch` | `vitest --typecheck.tsconfig tsconfig.test.json --watch` |
| `tunarr` | `dotenv -e .env.development -- tsx src/index.ts` |
| `typecheck` | `cross-env NODE_OPTIONS=--max-old-space-size=8192 tsgo -p tsconfig.build.json --noEmit --diagnostics` |

## `@tunarr/shared`

| Field | Value |
| --- | --- |
| Path | `shared` |
| Version | `1.2.0-dev.1` |
| Private | `True` |
| License | `Zlib` |
| Type | `module` |
| Main | `index.ts` |
| Binary | â€” |

### Scripts

| Name | Command |
| --- | --- |
| `build` | `tsgo --declaration` |
| `build-dev` | `tsgo --declaration --watch` |
| `bundle` | `tsgo` |
| `clean` | `rimraf ./dist/` |
| `dev` | `tsgo --declaration --watch` |
| `generate-search-diagram` | `tsx scripts/generate_search_diagram.ts` |
| `test` | `vitest --run` |

## `@tunarr/types`

| Field | Value |
| --- | --- |
| Path | `types` |
| Version | `1.2.0-dev.1` |
| Private | `True` |
| License | `Zlib` |
| Type | `module` |
| Main | `./dist/src/index.js` |
| Binary | â€” |

### Scripts

| Name | Command |
| --- | --- |
| `build` | `tsgo --declaration` |
| `build-dev` | `tsgo --declaration --watch` |
| `clean` | `rimraf ./build/` |
| `dev` | `tsgo --declaration --watch` |
| `gen-emby` | `typed-openapi https://swagger.emby.media/openapi.json -r zod -o ./build/emby-generated.ts` |

## `@tunarr/web`

| Field | Value |
| --- | --- |
| Path | `web` |
| Version | `1.2.0-dev.1` |
| Private | `True` |
| License | â€” |
| Type | `module` |
| Main | â€” |
| Binary | â€” |

### Scripts

| Name | Command |
| --- | --- |
| `build` | `tsgo -p tsconfig.build.json --noEmit` |
| `build-dev` | `tsgo -p tsconfig.build.json --noEmit --watch` |
| `bundle` | `vite build` |
| `compile-messages` | `lingui compile --typescript` |
| `dev` | `vite` |
| `extract-messages` | `lingui extract` |
| `extract-template` | `lingui extract-template` |
| `generate-client` | `openapi-ts` |
| `lint` | `eslint . --report-unused-disable-directives --max-warnings 0` |
| `preview` | `vite preview` |
| `regen-routes` | `tsr generate` |
| `test` | `vitest --run` |
| `typecheck` | `tsgo -p tsconfig.build.json --noEmit` |

## Boundary Note

Package responsibilities are inherited observations, not final ChannelForge
module boundaries. Milestone 02 owns boundary decisions.
