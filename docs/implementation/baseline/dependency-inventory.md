# Dependency Inventory

- **Source commit:** `195a4d04aca082af04362152f56283c139e9eaad`
- **Package manifests:** `5`
- **Declared dependency entries:** `253`
- **Unique dependency names:** `197`
- **Direct workspace dependency entries:** `5`

## Package and Section Counts

| Package | Dependencies | Development | Optional | Peer | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `tunarr` | 0 | 37 | 0 | 0 | 37 |
| `@tunarr/server` | 60 | 44 | 0 | 0 | 104 |
| `@tunarr/shared` | 7 | 11 | 0 | 1 | 19 |
| `@tunarr/types` | 1 | 9 | 0 | 0 | 10 |
| `@tunarr/web` | 46 | 37 | 0 | 0 | 83 |

## Dependency Classifications

| Classification | Meaning | Count |
| --- | --- | ---: |
| workspace | Direct dependency on another inherited workspace package | 5 |
| catalog | Version is resolved through a pnpm workspace catalog | 37 |
| external | Version or range is declared directly in the manifest | 211 |

## Complete Manifest Inventory

| Package | Section | Dependency | Specification | Classification |
| --- | --- | --- | --- | --- |
| `tunarr` | `devDependencies` | `@commitlint/cli` | `^19.3.0` | `external` |
| `tunarr` | `devDependencies` | `@commitlint/config-conventional` | `^19.2.2` | `external` |
| `tunarr` | `devDependencies` | `@commitlint/types` | `^19.0.3` | `external` |
| `tunarr` | `devDependencies` | `@eslint/eslintrc` | `^3.0.2` | `external` |
| `tunarr` | `devDependencies` | `@eslint/js` | `^9.0.0` | `external` |
| `tunarr` | `devDependencies` | `@release-it/bumper` | `^7.0.5` | `external` |
| `tunarr` | `devDependencies` | `@release-it/conventional-changelog` | `^10.0.4` | `external` |
| `tunarr` | `devDependencies` | `@semantic-release/changelog` | `^6.0.3` | `external` |
| `tunarr` | `devDependencies` | `@types/node` | `22.10.7` | `external` |
| `tunarr` | `devDependencies` | `@types/semver` | `^7.7.1` | `external` |
| `tunarr` | `devDependencies` | `@typescript-eslint/eslint-plugin` | `catalog:` | `catalog` |
| `tunarr` | `devDependencies` | `@typescript-eslint/parser` | `catalog:` | `catalog` |
| `tunarr` | `devDependencies` | `@vitest/coverage-v8` | `catalog:vitest` | `catalog` |
| `tunarr` | `devDependencies` | `esbuild` | `^0.21.5` | `external` |
| `tunarr` | `devDependencies` | `eslint` | `catalog:` | `catalog` |
| `tunarr` | `devDependencies` | `eslint-import-resolver-typescript` | `^4.4.4` | `external` |
| `tunarr` | `devDependencies` | `eslint-plugin-import` | `^2.31.0` | `external` |
| `tunarr` | `devDependencies` | `eslint-plugin-lingui` | `^0.13.1` | `external` |
| `tunarr` | `devDependencies` | `eslint-plugin-react` | `^7.37.3` | `external` |
| `tunarr` | `devDependencies` | `eslint-plugin-react-hooks` | `^7.0.1` | `external` |
| `tunarr` | `devDependencies` | `eslint-plugin-react-refresh` | `^0.4.16` | `external` |
| `tunarr` | `devDependencies` | `eslint-plugin-unused-imports` | `^4.1.4` | `external` |
| `tunarr` | `devDependencies` | `globals` | `^15.0.0` | `external` |
| `tunarr` | `devDependencies` | `husky` | `^9.0.11` | `external` |
| `tunarr` | `devDependencies` | `knip` | `^6.7.0` | `external` |
| `tunarr` | `devDependencies` | `lint-staged` | `^15.2.2` | `external` |
| `tunarr` | `devDependencies` | `prettier` | `^3.5.1` | `external` |
| `tunarr` | `devDependencies` | `release-it` | `^19.2.2` | `external` |
| `tunarr` | `devDependencies` | `release-it-pnpm` | `^4.6.6` | `external` |
| `tunarr` | `devDependencies` | `semantic-release` | `^25.0.2` | `external` |
| `tunarr` | `devDependencies` | `semver` | `^7.7.3` | `external` |
| `tunarr` | `devDependencies` | `should-semantic-release` | `^0.3.5` | `external` |
| `tunarr` | `devDependencies` | `tsx` | `^4.20.5` | `external` |
| `tunarr` | `devDependencies` | `turbo` | `^2.5.3` | `external` |
| `tunarr` | `devDependencies` | `typescript` | `catalog:` | `catalog` |
| `tunarr` | `devDependencies` | `typescript-eslint` | `^8.46.1` | `external` |
| `tunarr` | `devDependencies` | `vitest` | `catalog:vitest` | `catalog` |
| `@tunarr/server` | `dependencies` | `@cospired/i18n-iso-languages` | `^4.2.0` | `external` |
| `@tunarr/server` | `dependencies` | `@dotenvx/dotenvx` | `^1.49.0` | `external` |
| `@tunarr/server` | `dependencies` | `@fastify/cors` | `^10.1.0` | `external` |
| `@tunarr/server` | `dependencies` | `@fastify/error` | `^4.2.0` | `external` |
| `@tunarr/server` | `dependencies` | `@fastify/multipart` | `^9.0.3` | `external` |
| `@tunarr/server` | `dependencies` | `@fastify/static` | `^8.2.0` | `external` |
| `@tunarr/server` | `dependencies` | `@fastify/swagger` | `^9.5.1` | `external` |
| `@tunarr/server` | `dependencies` | `@iptv/xmltv` | `^1.0.1` | `external` |
| `@tunarr/server` | `dependencies` | `@logdna/tail-file` | `^4.0.2` | `external` |
| `@tunarr/server` | `dependencies` | `@marcbachmann/cel-js` | `^7.6.1` | `external` |
| `@tunarr/server` | `dependencies` | `@scalar/fastify-api-reference` | `^1.34.6` | `external` |
| `@tunarr/server` | `dependencies` | `@tunarr/playlist` | `^1.1.0` | `external` |
| `@tunarr/server` | `dependencies` | `@tunarr/shared` | `workspace:*` | `workspace` |
| `@tunarr/server` | `dependencies` | `@tunarr/types` | `workspace:*` | `workspace` |
| `@tunarr/server` | `dependencies` | `@types/better-sqlite3` | `^7.6.13` | `external` |
| `@tunarr/server` | `dependencies` | `archiver` | `^7.0.1` | `external` |
| `@tunarr/server` | `dependencies` | `async-mutex` | `^0.5.0` | `external` |
| `@tunarr/server` | `dependencies` | `async-retry` | `^1.3.3` | `external` |
| `@tunarr/server` | `dependencies` | `axios` | `>=1.12.0` | `external` |
| `@tunarr/server` | `dependencies` | `base32` | `^0.0.7` | `external` |
| `@tunarr/server` | `dependencies` | `better-sqlite3` | `11.8.1` | `external` |
| `@tunarr/server` | `dependencies` | `blurhash` | `^2.0.5` | `external` |
| `@tunarr/server` | `dependencies` | `chalk` | `^5.6.0` | `external` |
| `@tunarr/server` | `dependencies` | `cron-parser` | `^4.9.0` | `external` |
| `@tunarr/server` | `dependencies` | `dayjs` | `catalog:` | `catalog` |
| `@tunarr/server` | `dependencies` | `drizzle-orm` | `^0.39.3` | `external` |
| `@tunarr/server` | `dependencies` | `fastify` | `^5.6.1` | `external` |
| `@tunarr/server` | `dependencies` | `fastify-graceful-shutdown` | `^4.0.1` | `external` |
| `@tunarr/server` | `dependencies` | `fastify-plugin` | `^5.0.1` | `external` |
| `@tunarr/server` | `dependencies` | `fastify-print-routes` | `^3.2.0` | `external` |
| `@tunarr/server` | `dependencies` | `fastify-type-provider-zod` | `^5.0.3` | `external` |
| `@tunarr/server` | `dependencies` | `fast-xml-parser` | `^4.5.3` | `external` |
| `@tunarr/server` | `dependencies` | `file-type` | `^19.6.0` | `external` |
| `@tunarr/server` | `dependencies` | `find-process` | `^2.0.0` | `external` |
| `@tunarr/server` | `dependencies` | `graphology` | `^0.26.0` | `external` |
| `@tunarr/server` | `dependencies` | `graphology-dag` | `^0.4.1` | `external` |
| `@tunarr/server` | `dependencies` | `inversify` | `^8.1.0` | `external` |
| `@tunarr/server` | `dependencies` | `jsonpath-plus` | `^10.3.0` | `external` |
| `@tunarr/server` | `dependencies` | `kysely` | `^0.27.6` | `external` |
| `@tunarr/server` | `dependencies` | `lodash-es` | `^4.17.21` | `external` |
| `@tunarr/server` | `dependencies` | `lowdb` | `^7.0.1` | `external` |
| `@tunarr/server` | `dependencies` | `meilisearch` | `^0.50.0` | `external` |
| `@tunarr/server` | `dependencies` | `music-metadata` | `^11.10.5` | `external` |
| `@tunarr/server` | `dependencies` | `node-cache` | `^5.1.2` | `external` |
| `@tunarr/server` | `dependencies` | `node-schedule` | `^2.1.1` | `external` |
| `@tunarr/server` | `dependencies` | `node-ssdp` | `^4.0.1` | `external` |
| `@tunarr/server` | `dependencies` | `pino` | `^9.9.1` | `external` |
| `@tunarr/server` | `dependencies` | `pino-pretty` | `^13.1.3` | `external` |
| `@tunarr/server` | `dependencies` | `pino-roll` | `^1.3.0` | `external` |
| `@tunarr/server` | `dependencies` | `p-queue` | `^8.1.0` | `external` |
| `@tunarr/server` | `dependencies` | `random-js` | `catalog:` | `catalog` |
| `@tunarr/server` | `dependencies` | `reflect-metadata` | `^0.2.2` | `external` |
| `@tunarr/server` | `dependencies` | `retry` | `^0.13.1` | `external` |
| `@tunarr/server` | `dependencies` | `sonic-boom` | `4.2.0` | `external` |
| `@tunarr/server` | `dependencies` | `split2` | `^4.2.0` | `external` |
| `@tunarr/server` | `dependencies` | `tslib` | `^2.8.1` | `external` |
| `@tunarr/server` | `dependencies` | `ts-pattern` | `^5.8.0` | `external` |
| `@tunarr/server` | `dependencies` | `uuid` | `^9.0.1` | `external` |
| `@tunarr/server` | `dependencies` | `yargs` | `^17.7.2` | `external` |
| `@tunarr/server` | `dependencies` | `zod` | `catalog:` | `catalog` |
| `@tunarr/server` | `devDependencies` | `@faker-js/faker` | `^9.9.0` | `external` |
| `@tunarr/server` | `devDependencies` | `@octokit/types` | `^13.10.0` | `external` |
| `@tunarr/server` | `devDependencies` | `@rollup/plugin-swc` | `^0.4.0` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/archiver` | `^6.0.3` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/async-retry` | `^1.4.9` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/lodash-es` | `4.17.9` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/node` | `22.10.7` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/node-abi` | `^3.0.3` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/node-schedule` | `^2.1.8` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/retry` | `^0.12.5` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/split2` | `^4.2.3` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/tmp` | `^0.2.6` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/unzip-stream` | `^0.3.4` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/uuid` | `^9.0.8` | `external` |
| `@tunarr/server` | `devDependencies` | `@types/yargs` | `^17.0.33` | `external` |
| `@tunarr/server` | `devDependencies` | `@typescript/native-preview` | `catalog:` | `catalog` |
| `@tunarr/server` | `devDependencies` | `@vitest/coverage-v8` | `catalog:vitest` | `catalog` |
| `@tunarr/server` | `devDependencies` | `@yao-pkg/pkg` | `^6.9.0` | `external` |
| `@tunarr/server` | `devDependencies` | `cross-env` | `^7.0.3` | `external` |
| `@tunarr/server` | `devDependencies` | `del-cli` | `^3.0.1` | `external` |
| `@tunarr/server` | `devDependencies` | `dotenv-cli` | `^7.4.4` | `external` |
| `@tunarr/server` | `devDependencies` | `drizzle-kit` | `^0.30.6` | `external` |
| `@tunarr/server` | `devDependencies` | `esbuild` | `^0.21.5` | `external` |
| `@tunarr/server` | `devDependencies` | `esbuild-plugin-pino` | `^2.3.3` | `external` |
| `@tunarr/server` | `devDependencies` | `fast-check` | `^4.2.0` | `external` |
| `@tunarr/server` | `devDependencies` | `fast-glob` | `^3.3.3` | `external` |
| `@tunarr/server` | `devDependencies` | `globals` | `^15.15.0` | `external` |
| `@tunarr/server` | `devDependencies` | `kysely-ctl` | `^0.9.0` | `external` |
| `@tunarr/server` | `devDependencies` | `memfs` | `^4.51.0` | `external` |
| `@tunarr/server` | `devDependencies` | `node-abi` | `^3.75.0` | `external` |
| `@tunarr/server` | `devDependencies` | `prettier` | `^3.6.2` | `external` |
| `@tunarr/server` | `devDependencies` | `rimraf` | `^5.0.10` | `external` |
| `@tunarr/server` | `devDependencies` | `tar` | `^7.4.3` | `external` |
| `@tunarr/server` | `devDependencies` | `thread-stream` | `^3.1.0` | `external` |
| `@tunarr/server` | `devDependencies` | `tmp` | `^0.2.5` | `external` |
| `@tunarr/server` | `devDependencies` | `tmp-promise` | `^3.0.3` | `external` |
| `@tunarr/server` | `devDependencies` | `tsconfig-paths` | `^4.2.0` | `external` |
| `@tunarr/server` | `devDependencies` | `ts-essentials` | `^10.1.1` | `external` |
| `@tunarr/server` | `devDependencies` | `ts-mockito` | `^2.6.1` | `external` |
| `@tunarr/server` | `devDependencies` | `tsx` | `^4.20.5` | `external` |
| `@tunarr/server` | `devDependencies` | `typed-emitter` | `^2.1.0` | `external` |
| `@tunarr/server` | `devDependencies` | `typescript` | `catalog:` | `catalog` |
| `@tunarr/server` | `devDependencies` | `typescript-eslint` | `^8.41.0` | `external` |
| `@tunarr/server` | `devDependencies` | `vitest` | `catalog:vitest` | `catalog` |
| `@tunarr/shared` | `dependencies` | `@tunarr/types` | `workspace:*` | `workspace` |
| `@tunarr/shared` | `dependencies` | `chevrotain` | `^11.0.3` | `external` |
| `@tunarr/shared` | `dependencies` | `dayjs` | `catalog:` | `catalog` |
| `@tunarr/shared` | `dependencies` | `lodash-es` | `catalog:` | `catalog` |
| `@tunarr/shared` | `dependencies` | `random-js` | `catalog:` | `catalog` |
| `@tunarr/shared` | `dependencies` | `tslib` | `^2.6.2` | `external` |
| `@tunarr/shared` | `dependencies` | `zod` | `catalog:` | `catalog` |
| `@tunarr/shared` | `devDependencies` | `@rollup/plugin-swc` | `^0.4.0` | `external` |
| `@tunarr/shared` | `devDependencies` | `@types/lodash-es` | `4.17.9` | `external` |
| `@tunarr/shared` | `devDependencies` | `@types/node` | `22.10.7` | `external` |
| `@tunarr/shared` | `devDependencies` | `@typescript/native-preview` | `catalog:` | `catalog` |
| `@tunarr/shared` | `devDependencies` | `@vitest/coverage-v8` | `catalog:vitest` | `catalog` |
| `@tunarr/shared` | `devDependencies` | `rimraf` | `^5.0.5` | `external` |
| `@tunarr/shared` | `devDependencies` | `ts-essentials` | `^9.4.2` | `external` |
| `@tunarr/shared` | `devDependencies` | `tsup` | `^8.0.2` | `external` |
| `@tunarr/shared` | `devDependencies` | `tsx` | `^4.20.5` | `external` |
| `@tunarr/shared` | `devDependencies` | `typescript` | `catalog:` | `catalog` |
| `@tunarr/shared` | `devDependencies` | `vitest` | `catalog:vitest` | `catalog` |
| `@tunarr/shared` | `peerDependencies` | `ts-pattern` | `^5.4.0` | `external` |
| `@tunarr/types` | `dependencies` | `zod` | `catalog:` | `catalog` |
| `@tunarr/types` | `devDependencies` | `@microsoft/api-extractor` | `^7.43.0` | `external` |
| `@tunarr/types` | `devDependencies` | `@typescript/native-preview` | `catalog:` | `catalog` |
| `@tunarr/types` | `devDependencies` | `@typescript-eslint/eslint-plugin` | `catalog:` | `catalog` |
| `@tunarr/types` | `devDependencies` | `@typescript-eslint/parser` | `catalog:` | `catalog` |
| `@tunarr/types` | `devDependencies` | `eslint` | `catalog:` | `catalog` |
| `@tunarr/types` | `devDependencies` | `rimraf` | `^5.0.5` | `external` |
| `@tunarr/types` | `devDependencies` | `tsup` | `^8.0.2` | `external` |
| `@tunarr/types` | `devDependencies` | `typed-openapi` | `^0.10.1` | `external` |
| `@tunarr/types` | `devDependencies` | `typescript` | `catalog:` | `catalog` |
| `@tunarr/web` | `dependencies` | `@cospired/i18n-iso-languages` | `^4.2.0` | `external` |
| `@tunarr/web` | `dependencies` | `@dotenvx/dotenvx` | `^1.45.1` | `external` |
| `@tunarr/web` | `dependencies` | `@emotion/react` | `^11.14.0` | `external` |
| `@tunarr/web` | `dependencies` | `@emotion/styled` | `^11.14.0` | `external` |
| `@tunarr/web` | `dependencies` | `@hookform/error-message` | `^2.0.1` | `external` |
| `@tunarr/web` | `dependencies` | `@hookform/resolvers` | `^5.2.2` | `external` |
| `@tunarr/web` | `dependencies` | `@lingui/core` | `^5.9.0` | `external` |
| `@tunarr/web` | `dependencies` | `@lingui/react` | `^5.9.0` | `external` |
| `@tunarr/web` | `dependencies` | `@mui/icons-material` | `^7.0.2` | `external` |
| `@tunarr/web` | `dependencies` | `@mui/material` | `^7.0.2` | `external` |
| `@tunarr/web` | `dependencies` | `@mui/x-date-pickers` | `^8.4.0` | `external` |
| `@tunarr/web` | `dependencies` | `@tanstack/react-form` | `^1.28.0` | `external` |
| `@tunarr/web` | `dependencies` | `@tanstack/react-query` | `^5.18.1` | `external` |
| `@tunarr/web` | `dependencies` | `@tanstack/react-query-devtools` | `^5.18.1` | `external` |
| `@tunarr/web` | `dependencies` | `@tanstack/react-router` | `^1.133.13` | `external` |
| `@tunarr/web` | `dependencies` | `@tanstack/zod-adapter` | `^1.131.27` | `external` |
| `@tunarr/web` | `dependencies` | `@tunarr/shared` | `workspace:*` | `workspace` |
| `@tunarr/web` | `dependencies` | `@tunarr/types` | `workspace:*` | `workspace` |
| `@tunarr/web` | `dependencies` | `@uidotdev/usehooks` | `^2.4.1` | `external` |
| `@tunarr/web` | `dependencies` | `axios` | `>=1.12.0` | `external` |
| `@tunarr/web` | `dependencies` | `bowser` | `^2.11.0` | `external` |
| `@tunarr/web` | `dependencies` | `color` | `^5.0.0` | `external` |
| `@tunarr/web` | `dependencies` | `colorjs.io` | `^0.5.2` | `external` |
| `@tunarr/web` | `dependencies` | `dayjs` | `catalog:` | `catalog` |
| `@tunarr/web` | `dependencies` | `hls.js` | `^1.6.15` | `external` |
| `@tunarr/web` | `dependencies` | `immer` | `^10.0.3` | `external` |
| `@tunarr/web` | `dependencies` | `lodash-es` | `catalog:` | `catalog` |
| `@tunarr/web` | `dependencies` | `material-react-table` | `^3.2.1` | `external` |
| `@tunarr/web` | `dependencies` | `notistack` | `^3.0.1` | `external` |
| `@tunarr/web` | `dependencies` | `pluralize` | `^8.0.0` | `external` |
| `@tunarr/web` | `dependencies` | `query-string` | `^9.1.1` | `external` |
| `@tunarr/web` | `dependencies` | `random-js` | `catalog:` | `catalog` |
| `@tunarr/web` | `dependencies` | `react` | `^18.2.0` | `external` |
| `@tunarr/web` | `dependencies` | `react-dnd` | `^16.0.1` | `external` |
| `@tunarr/web` | `dependencies` | `react-dnd-html5-backend` | `^16.0.1` | `external` |
| `@tunarr/web` | `dependencies` | `react-dom` | `^18.2.0` | `external` |
| `@tunarr/web` | `dependencies` | `react-error-boundary` | `^6.0.0` | `external` |
| `@tunarr/web` | `dependencies` | `react-hook-form` | `^7.68.0` | `external` |
| `@tunarr/web` | `dependencies` | `react-transition-group` | `^4.4.5` | `external` |
| `@tunarr/web` | `dependencies` | `react-virtualized-auto-sizer` | `^1.0.26` | `external` |
| `@tunarr/web` | `dependencies` | `react-window` | `^1.8.9` | `external` |
| `@tunarr/web` | `dependencies` | `ts-pattern` | `^5.4.0` | `external` |
| `@tunarr/web` | `dependencies` | `usehooks-ts` | `^2.14.0` | `external` |
| `@tunarr/web` | `dependencies` | `uuid` | `^9.0.1` | `external` |
| `@tunarr/web` | `dependencies` | `zod` | `catalog:` | `catalog` |
| `@tunarr/web` | `dependencies` | `zustand` | `^4.4.6` | `external` |
| `@tunarr/web` | `devDependencies` | `@hey-api/openapi-ts` | `0.80.16` | `external` |
| `@tunarr/web` | `devDependencies` | `@lingui/cli` | `^5.9.0` | `external` |
| `@tunarr/web` | `devDependencies` | `@lingui/swc-plugin` | `^5.10.1` | `external` |
| `@tunarr/web` | `devDependencies` | `@lingui/vite-plugin` | `^5.9.0` | `external` |
| `@tunarr/web` | `devDependencies` | `@tanstack/react-devtools` | `^0.9.4` | `external` |
| `@tunarr/web` | `devDependencies` | `@tanstack/react-form-devtools` | `^0.2.13` | `external` |
| `@tunarr/web` | `devDependencies` | `@tanstack/react-router-devtools` | `^1.158.1` | `external` |
| `@tunarr/web` | `devDependencies` | `@tanstack/react-table` | `8.19.3` | `external` |
| `@tunarr/web` | `devDependencies` | `@tanstack/router-cli` | `^1.35.4` | `external` |
| `@tunarr/web` | `devDependencies` | `@tanstack/router-vite-plugin` | `^1.133.13` | `external` |
| `@tunarr/web` | `devDependencies` | `@testing-library/jest-dom` | `^6.9.1` | `external` |
| `@tunarr/web` | `devDependencies` | `@testing-library/react` | `^16.3.2` | `external` |
| `@tunarr/web` | `devDependencies` | `@testing-library/user-event` | `^14.6.1` | `external` |
| `@tunarr/web` | `devDependencies` | `@types/lodash-es` | `4.17.9` | `external` |
| `@tunarr/web` | `devDependencies` | `@types/pluralize` | `^0.0.33` | `external` |
| `@tunarr/web` | `devDependencies` | `@types/react` | `^18.2.15` | `external` |
| `@tunarr/web` | `devDependencies` | `@types/react-dom` | `^18.2.7` | `external` |
| `@tunarr/web` | `devDependencies` | `@types/react-transition-group` | `^4.4.12` | `external` |
| `@tunarr/web` | `devDependencies` | `@types/react-window` | `^1.8.8` | `external` |
| `@tunarr/web` | `devDependencies` | `@types/uuid` | `^9.0.6` | `external` |
| `@tunarr/web` | `devDependencies` | `@typescript/native-preview` | `catalog:` | `catalog` |
| `@tunarr/web` | `devDependencies` | `@typescript-eslint/eslint-plugin` | `catalog:` | `catalog` |
| `@tunarr/web` | `devDependencies` | `@typescript-eslint/parser` | `catalog:` | `catalog` |
| `@tunarr/web` | `devDependencies` | `@vitejs/plugin-react-swc` | `^4.2.3` | `external` |
| `@tunarr/web` | `devDependencies` | `baseline-browser-mapping` | `^2.10.22` | `external` |
| `@tunarr/web` | `devDependencies` | `eslint` | `catalog:` | `catalog` |
| `@tunarr/web` | `devDependencies` | `eslint-plugin-react-hooks` | `^5.1.0` | `external` |
| `@tunarr/web` | `devDependencies` | `eslint-plugin-react-refresh` | `^0.4.16` | `external` |
| `@tunarr/web` | `devDependencies` | `jsdom` | `^28.0.0` | `external` |
| `@tunarr/web` | `devDependencies` | `make-vfs` | `^1.0.15` | `external` |
| `@tunarr/web` | `devDependencies` | `nodemon` | `^3.0.3` | `external` |
| `@tunarr/web` | `devDependencies` | `openapi-zod-client` | `^1.14.0` | `external` |
| `@tunarr/web` | `devDependencies` | `ts-essentials` | `^9.4.2` | `external` |
| `@tunarr/web` | `devDependencies` | `typescript` | `catalog:` | `catalog` |
| `@tunarr/web` | `devDependencies` | `vite` | `^7.1.10` | `external` |
| `@tunarr/web` | `devDependencies` | `vite-plugin-svgr` | `^4.5.0` | `external` |
| `@tunarr/web` | `devDependencies` | `vitest` | `catalog:vitest` | `catalog` |

## Root pnpm Controls

### Patched Dependencies

- `kysely` â†’ `patches/kysely.patch`

### Native Build Allowlist

- `@swc/core`
- `arktype`
- `better-sqlite3`
- `esbuild`
- `unrs-resolver`

## Limits

This is a manifest inventory. It does not yet provide:

- Transitive dependency resolution analysis
- Vulnerability assessment
- Dependency-license compatibility analysis
- Runtime import ownership
- Dead-dependency conclusions

Those findings require separate evidence and must not be inferred solely
from package manifests.
