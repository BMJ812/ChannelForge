# Architecture Tests

- **Authority:** Milestone 02
- **Tool:** Custom Node.js scanner using the existing TypeScript compiler API
- **New dependency:** None
- **Runtime behavior changed:** No

## Commands

Run the complete architecture validation from the repository root:

```text
pnpm test:architecture
```

The command runs:

1. Architecture-harness self-tests
2. The repository architecture scan

Machine-readable scan output is available through:

```text
node scripts/architecture/check.mjs --json
```

## Why This Mechanism

The repository already carries TypeScript as a root development dependency.
Using its parser provides reliable import extraction without adding
Dependency Cruiser or another package during the first enforcement unit.

ESLint remains useful for local syntax and code-quality rules, but its current
configuration ignores tests and scripts and does not by itself provide the
waiver registry, deterministic report, or module-structure checks required by
M02.

## Strict Scope

The repository scan inspects:

```text
server/src/modules
server/src/app
server/src/infrastructure
server/src/compatibility
server/src/transport
shared/src
types/src
web/src
```

Absent structural directories remain valid during staged M02 implementation.

`SHR-001` and `TYP-001` additionally scan legacy `server/src/**`,
`server/scripts/**`, and root `scripts/**`. Those extended scans evaluate only
shared-package and Types-package deep imports; they do not apply the other
module-direction rules to inherited server or tooling code.

## Fixtures

The self-test suite covers:

- Allowed same-module import
- Allowed public cross-module import
- Forbidden deep cross-module import
- Forbidden domain-to-infrastructure import
- Forbidden scheduling-to-playout import
- Forbidden web-to-server import
- Allowed compatibility adapter behavior
- Allowed business-module dependency on a declared compatibility port
- Forbidden business-module dependency on compatibility implementation
- Forbidden new-module direct import of inherited server internals
- Direct module database import producing both `CMP-001` and `MOD-009`
- Forbidden application-host direct import of inherited server internals
- Allowed compatibility adapter import of inherited database code
- Expired waiver
- Critical-rule waiver rejection
- Non-padded waiver milestone rejection
- Deterministic violation ordering
- Noncanonical module directory
- Missing module `index.ts`
- Missing module `README.md`
- File placed directly under the modules root
- Allowed new-module import from `@tunarr/shared/kernel`
- Forbidden new-module import from legacy shared entry points
- Forbidden deep import into `shared/src`
- Allowed neutral shared-kernel production and test dependencies
- Forbidden shared-kernel dependency on legacy or domain code
- Complete shared-package export classification
- Missing shared-package export classification
- Forbidden relative import from `shared/dist`
- Forbidden undeclared shared-package subpath
- Forbidden shared deep imports from legacy server code, root scripts, and server scripts
- Forbidden shared deep imports from the Types workspace
- Allowed exact inherited deep-import baseline with a different source rejected
- Duplicate occurrence of a baselined import rejected
- Malformed inherited baseline rejection
- Unused inherited baseline rejection
- Waiver attempt for explicitly non-waivable `SHR-004` rejected
- Allowed new-module import from `@tunarr/types/contracts`
- Allowed public-contract production and test dependencies
- Forbidden inherited Types entry points from new modules
- Forbidden relative import into `types/src`
- Forbidden undeclared Types package subpath
- Forbidden public-contract dependency on inherited, provider, or runtime code
- Complete Types-package export classification
- Missing Types-package export classification
- Noncanonical public-contract export target
- Forbidden Types deep imports from legacy server code, root scripts, and server scripts
- Waiver attempt for explicitly non-waivable `TYP-004` rejected

## Determinism

The scanner:

- Sorts directory entries
- Normalizes separators
- Sorts violations by rule, source, import, and message
- Uses exact waiver matching
- Avoids filesystem-enumeration order as an input to results

## Output

A failing violation includes:

- Rule identifier
- Rule title
- Source path
- Import specifier when applicable
- Actionable rule message

The command exits nonzero when:

- An active violation exists
- The waiver registry is malformed
- A waiver is expired
- A waiver targets a critical rule
- A waiver contains wildcards
- A waiver is unused
- A shared-package export is unclassified
- The governed kernel export points at a noncanonical target
- The inherited shared deep-import baseline is malformed or unused
- A Types-package export is unclassified
- The governed public-contract export points at a noncanonical target
- A waiver targets an explicitly non-waivable rule

## CI

`.github/workflows/architecture.yml` runs the stable root command on:

- `ubuntu-latest`
- `windows-latest`

The workflow pins:

- Node.js `22.20.0`
- pnpm `10.28.0`

## Performance

The architecture command is expected to complete in under 30 seconds after
dependencies are installed. PR 02A does not add graph construction or package
splitting.

## Milestone 02 Completion Verification

The completion unit verifies:

- 17 canonical module directories
- 17 public module entry points
- 17 module READMEs
- Zero business-module dependency cycles
- Zero active architecture waivers
- Zero new architecture violations
- Web-to-server enforcement remains active
- Linux and Windows CI execution remains configured
- Full repository build remains green
