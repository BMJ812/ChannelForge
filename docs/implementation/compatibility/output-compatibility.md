# Output Compatibility Policy

## Scope

PR 04L establishes the compatibility boundary for inherited Tunarr output
artifacts and externally visible protocol paths.

The roadmap scope is:

- XMLTV;
- M3U;
- HDHomeRun-compatible identity;
- last-valid artifacts; and
- existing route paths.

PR 04L does not activate a production output cutover.

## Output Ownership

The ChannelForge Output module owns the target output contracts.

Compatibility may adapt inherited output behavior, but inherited output DTOs,
database rows, route handlers, and generators do not become ChannelForge domain
contracts.

## Artifact Precedence

Compatibility resolves output artifacts in this order:

1. valid canonical artifact;
2. last valid canonical artifact;
3. supported legacy artifact;
4. controlled unavailable result.

A lower-precedence artifact is never consulted after a valid higher-precedence
artifact is found.

A legacy artifact cannot overwrite canonical output state.

## Validity

PR 04L provides structural validation by default:

- non-empty content type; and
- non-empty artifact body.

Protocol-aware validators may replace the structural validator at composition
time.

The compatibility boundary does not claim that structural validation alone is
full XMLTV, M3U, or HDHomeRun protocol certification.

## Last-Valid Artifact

Last-valid canonical output is an explicit compatibility input.

PR 04L defines the reader contract but introduces no Output persistence schema
and no artifact-store cutover.

The last-valid reader is read-only.

## Legacy Fallback

Legacy output fallback is allowed only after canonical and last-valid canonical
output are unavailable or invalid.

Fallback usage is measurable.

Legacy generator exceptions are translated to controlled compatibility state;
raw exceptions are not exposed through the output result contract.

## HDHomeRun-Compatible Identity

Device identity is preserved, not regenerated.

The compatibility identity read accepts an inherited device ID and returns that
same value as an immutable Output-owned identity model.

PR 04L does not:

- create a new device ID;
- rotate a device ID;
- derive a device ID from ChannelForge identity;
- alter tuner identity; or
- activate a device-identity cutover.

Changing device identity remains a separate compatibility decision.

## Existing Protocol Paths

The compatibility contract pins these inherited route paths:

```text
/api/xmltv.xml
/api/channels.m3u
/device.xml
/discover.json
/lineup_status.json
/lineup.json
/stream/channels/:id
```

04L does not rename, redirect, remove, or re-register these routes.

Protocol path preservation is distinct from later handler cutover.

## Stream URLs

The compatibility route templates contain no credential query parameters.

04L does not introduce provider credentials, signed provider URLs, or access
tokens into output route contracts.

Dynamic stream-route resolution remains delegated to the existing Output
reader contract.

## Metrics

04L uses bounded compatibility dimensions.

Added counters are:

- `LAST_VALID_OUTPUT_FALLBACKS`;
- `OUTPUT_ARTIFACT_UNAVAILABLE`; and
- `HDHR_IDENTITY_READS`.

The existing `LEGACY_OUTPUT_FALLBACKS`, `CANONICAL_READS`, and
`COMPATIBILITY_ERRORS` counters are reused.

Raw channel IDs, device IDs, schedule IDs, program IDs, and artifact bodies are
not metric dimensions.

## Runtime Authority

```text
Production output cutover:      none
Canonical output authority:     not activated by 04L
Legacy output authority:        unchanged
Legacy route paths:             unchanged
Legacy artifact generation:     unchanged
Output persistence migration:   none
HDHR device identity change:    none
Stream-route cutover:           none
```

## Rollback

Rollback is code-only.

Stop consuming the compatibility output reader and preserve the inherited
runtime.

No schema rollback or data rollback is required.
