# OpenAPI Inventory

- **Source commit:** `0e5491f87259123a3cb085e3d2ba3844eda510d0`
- **Discovery evidence SHA-256:** `9957491ba89d96bcc67bdd17a8ab7be275618fa645ad021de7fa6c6347e322d9`
- **Status:** Reviewed static baseline

## Generation and Client Pipeline

| Area | Current authority | Evidence |
| --- | --- | --- |
| Runtime JSON document | `GET /openapi.json` | Verified |
| Runtime YAML document | `GET /openapi.yaml` | Verified |
| Server generation command | `pnpm --filter @tunarr/server generate-openapi` / `tsx src/index.ts generate-openapi` | Verified |
| Root generated document | `tunarr-openapi.json` | Verified |
| Versioned documentation copy | `docs/generated/tunarr-v<version>-openapi.json` | Verified |
| Web client input | `../tunarr-openapi.json` | Verified |
| Web client output | `web/src/generated` | Verified |
| Legacy helper file | `server/scripts/generate-openapi.ts` | Tracked but empty |

The generation command bootstraps an ephemeral data directory, configures and
starts the Fastify server, asks the registered Swagger plugin for the document,
writes the root JSON file, copies a versioned document into
`docs/generated`, removes the temporary directory, and exits.

The first-party web package reads the root OpenAPI document and generates code
under `web/src/generated` using the Axios client and TanStack Query
plugins.

## Route Coverage Baseline

| Measure | Count |
| --- | ---: |
| Reviewed route declarations | 197 |
| Unique effective method/path pairs | 196 |
| Routes with request-schema evidence | 144 |
| Routes with response-schema evidence | 132 |
| Routes without request-schema evidence | 53 |
| Routes without response-schema evidence | 65 |

Static schema evidence is not equivalent to generated-document coverage.
Fastify route hiding, transform hooks, route-object forms, generated schemas,
and dynamic registration can change the final OpenAPI output. PR 01C records
this distinction rather than claiming full coverage.

## Runtime OpenAPI Behavior

- `/openapi.json` and `/openapi.yaml` are registered at
  the root server and hidden from the generated document.
- Fastify Swagger uses the Zod JSON-schema transformation.
- Routes mounted outside the `/api` router may still be included
  unless explicitly hidden by their schema or registration transform.
- Static resources and selected maintenance routes are hidden.
- The OpenAPI title and description retain inherited Tunarr naming.

## Drift and Review Requirements

- Generate the OpenAPI document from the recorded source commit.
- Compare generated paths and methods with `api-inventory.md`.
- Record routes missing from either side.
- Regenerate the web client and require a clean diff.
- Treat renamed operations, schema narrowing, response changes, and error-shape
  changes as compatibility events.
- Preserve the root document name and generated-client location during M01.
