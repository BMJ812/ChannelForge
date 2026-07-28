# Module-Boundary Decision Register

- **Milestone:** M02
- **Current unit:** PR 02A
- **ADR changes:** None

## Decisions

### M02-DEC-001: Use the Existing TypeScript Parser

- **Status:** Accepted
- **Decision:** Implement the first architecture scanner with the TypeScript
  compiler API already present in root development tooling.
- **Reason:** It parses imports and re-exports reliably without adding a package.
- **Boundary:** Dependency Cruiser remains an option if later graph requirements
  exceed the custom scanner.
- **Rollback:** Remove the root command, scanner, tests, and workflow.

### M02-DEC-002: Adopt Path-Scoped Strict Enforcement

- **Status:** Accepted
- **Decision:** Enforce new structural roots strictly and leave unrelated legacy
  server paths outside strict scope.
- **Reason:** PR 02A moves no production code and must not establish a broad,
  unactionable legacy violation snapshot.
- **Boundary:** A later unit must explicitly move, wrap, or baseline each legacy
  path it brings under enforcement.
- **Rollback:** Remove the strict-root configuration.

### M02-DEC-003: Keep Waivers Exact and Expiring

- **Status:** Accepted
- **Decision:** Match waivers by rule, source, and import; reject wildcards,
  expired entries, unused entries, and critical-rule waivers.
- **Reason:** Boundary exceptions must remain measurable and removable.
- **Rollback:** Remove the registry only when no caller depends on an exception.

### M02-DEC-004: Run Architecture Tests on Windows and Linux

- **Status:** Accepted
- **Decision:** Add a dedicated two-platform workflow.
- **Reason:** Import paths are platform-sensitive and M02 completion requires
  both platforms.
- **Boundary:** The workflow runs only architecture validation; inherited build
  and test workflows remain authoritative for their existing scope.
- **Rollback:** Remove the dedicated workflow after equivalent matrix coverage
  exists elsewhere.
