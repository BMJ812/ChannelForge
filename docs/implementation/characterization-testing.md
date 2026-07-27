# Characterization Testing

- **Status:** Adopted foundation
- **Roadmap milestone:** M01 Baseline and Change Control
- **Pull-request unit:** 01F
- **Source commit:** `3370c66d801e2525edfce364fc2488d326ec10b3`
- **Runtime behavior changed:** No

## Purpose

Characterization tests record inherited behavior before ChannelForge replaces,
moves, or adapts the responsible subsystem.

A characterization test is not automatic approval of the behavior. Every test
must identify whether the behavior is intended to be preserved, adapted, or
replaced.

## Required Test Record

Each characterization suite or fixture must state:

- Behavior under test
- Current authority
- Source commit or fixture version
- Preserve, adapt, or replace intent
- Compatibility reason
- Controlled time, time zone, and random seed where relevant
- External dependencies and how they are isolated
- Expected output or checksum
- Removal or conversion condition

Recommended test comment:

```ts
/**
 * Characterization:
 * - authority: inherited scheduler
 * - intent: preserve until deterministic planner cutover
 * - source: 3370c66d801e2525edfce364fc2488d326ec10b3
 * - clock: 2026-07-27T12:00:00.000Z
 * - timeZone: America/Los_Angeles
 * - seed: 42
 * - conversion: replace with domain contract test in M07
 */
```

## Test Locations

Use the owning workspace and keep fixtures near their contract:

```text
server/src/testing/characterization/
server/src/<subsystem>/*.test.ts
shared/src/<subsystem>/*.test.ts
web/src/<subsystem>/*.test.tsx
```

The foundation helpers are test-only. Production modules must not import from
`server/src/testing/`.

## Controlled Time

Prefer an injected clock-shaped boundary.

Use `createManualTestClock()` when the subject can accept a clock dependency.
The helper supports fixed time, progression, rollback, and jumps without
changing process-wide timer state.

Use Vitest fake timers only when the inherited behavior directly depends on
global timers. Every fake-timer test must restore real timers.

Time-sensitive characterization should state both:

- UTC instant
- IANA time zone

DST tests must distinguish missing and repeated local times.

## Controlled Randomness

Use `createSeededTestRandom()` for inherited `random-js`
`MersenneTwister19937` behavior.

Record:

- Seed
- Generator identifier
- Input ordering
- Rule or fixture version
- Expected sequence or canonical checksum

Do not use `Math.random()` in a characterization assertion unless the random
source is explicitly replaced or mocked and the seed is recorded.

Random UUIDs must not determine expected ordering. Use stable synthetic IDs
when identity affects serialized output.

## Canonical JSON and Golden Files

Use `serializeCanonicalJson()` and `checksumCanonicalJson()` for JSON-compatible
golden values.

The canonicalizer defines:

- Lexically sorted object keys
- Preserved array order
- NFC Unicode normalization
- ISO-8601 Date serialization
- Finite numeric values
- `-0` normalized to `0`
- Compact JSON
- One trailing LF
- SHA-256 checksum

A golden update requires semantic review. Do not approve a changed snapshot
only because the test runner offers an update command.

The pull request must explain:

- What changed
- Why the prior output is no longer authoritative
- Whether compatibility is preserved
- Whether consumers require migration
- Which architecture or ADR authorizes the change

## Provider Contract Fixtures

Use `defineProviderContractFixture()` for new provider fixtures.

Every fixture records:

- Provider
- Provider version
- Endpoint
- Scenario
- Source type
- Sanitization version
- Fixture schema version
- Expected normalized result
- Synthetic or sanitized request and response values

Fixtures may be synthetic, sanitized recordings, or hand-authored edge cases.

Fixtures must not contain real credentials, profile paths, personal email
addresses, private library names, viewing history, or user media. Secret-like
fields must use an explicit synthetic or redacted placeholder.

A provider contract test must not contact a real Plex, Jellyfin, Emby, or local
media server.

## Filesystem and Database Tests

Use an isolated temporary directory or copied test database.

Tests must:

- Own their temporary path
- Close SQLite connections before cleanup
- Flush WAL state before copying when required
- Avoid user-profile and repository-global mutable state
- Make cleanup failures visible
- Classify Windows `EBUSY` behavior rather than retrying indefinitely

The inherited template-database setup remains in place. PR 01F does not replace
it.

## Network Isolation

Unit and characterization tests must not require internet access.

Provider, webhook, remote-feed, and playback-info tests require a synthetic
server, deterministic mock transport, or recorded sanitized fixture.

Timeout and rate-limit behavior must use controlled timers rather than wall
clock delays.

## Focused Validation

Run the foundation suite with:

```powershell
pnpm --filter @tunarr/server exec vitest `
    --config vitest.characterization.config.ts `
    --typecheck.tsconfig tsconfig.test.json `
    --run
```

The dedicated configuration does not load the inherited global template
database because the foundation helpers require no database, provider, network,
or FFmpeg process.

## Acceptance

A characterization test is acceptable when it:

- Fails on a meaningful inherited behavior change
- Uses controlled time and randomness
- Is independent of external network access
- Uses sanitized fixtures
- Produces deterministic output
- States preserve, adapt, or replace intent
- States its conversion or removal condition
- Does not alter production behavior
