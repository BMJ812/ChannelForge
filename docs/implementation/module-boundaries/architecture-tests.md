# Architecture Tests

- **Authority:** Milestone 02 PR 02A
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
web/src
```

Absent directories are valid during PR 02A.

## Fixtures

The self-test suite covers:

- Allowed same-module import
- Allowed public cross-module import
- Forbidden deep cross-module import
- Forbidden domain-to-infrastructure import
- Forbidden scheduling-to-playout import
- Forbidden web-to-server import
- Allowed compatibility adapter behavior
- Expired waiver
- Critical-rule waiver rejection
- Non-padded waiver milestone rejection
- Deterministic violation ordering
- Noncanonical module directory
- Missing module `index.ts`
- Missing module `README.md`
- File placed directly under the modules root

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
