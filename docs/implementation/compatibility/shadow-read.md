# Shadow Read Framework

- **Milestone:** 04
- **Unit:** PR 04E - Shadow Read Framework
- **Runtime mode transition:** none
- **Read authority transition:** none
- **Write authority transition:** none
- **Production shadow policy enabled:** no

## Purpose

Shadow Read compares legacy and canonical representations while keeping exactly
one side authoritative.

The comparison exists to:

- detect translation mismatch
- measure migration quality
- detect stale canonical data
- detect hidden legacy behavior
- build cutover confidence

A shadow comparison does not create dual authority.

## Framework Contract

The framework receives:

- concept
- entity type when applicable
- designated authority
- legacy observation
- canonical observation
- operation
- route template when applicable
- correlation ID when available
- application version when available
- source schema version when available
- optional sampling policy
- optional cancellation signal
- optional value-difference classifier

The framework returns either:

```text
COMPARED
```

with a finding, or:

```text
SKIPPED
```

with one of:

```text
DISABLED
SAMPLED_OUT
ABORTED
```

The authoritative observation is returned unchanged.

## Observation States

Each side is represented as:

```text
VALUE
MISSING
ERROR
```

Error observations contain only a stable error code.

Raw exception text, stack traces, SQL, provider credentials, and private payloads
do not belong in the shadow finding.

## Finding

A comparison records:

- Concept
- Authority
- Legacy checksum
- Canonical checksum
- Difference class
- Route or operation
- Timestamp
- Correlation ID when available
- Severity

The framework stores checksums, not the compared payload.

## Difference Classes

The exact M04 classes are:

```text
EQUAL
EXPECTED_FORMATTING_DIFFERENCE
EXPECTED_SEMANTIC_DIFFERENCE
LEGACY_MISSING
CANONICAL_MISSING
IDENTITY_MISMATCH
VALUE_MISMATCH
ORDER_MISMATCH
ERROR_MISMATCH
UNKNOWN
```

Missing and error states are classified by the framework.

Value-specific semantic classification is supplied by the owning compatibility
adapter because only that adapter knows whether a difference is expected,
identity-related, order-related, or a true value mismatch.

Without a value-specific classifier, unequal values become `VALUE_MISMATCH`.

## Stable Checksums

Values are converted to deterministic JSON before SHA-256.

Object keys are sorted.

Array order is preserved.

This allows order differences to remain observable while eliminating object-key
serialization noise.

Checksums are diagnostic evidence only.

They do not become entity identity.

## Severity

Initial framework severity is:

| Difference | Severity |
| --- | --- |
| `EQUAL` | `INFO` |
| `EXPECTED_FORMATTING_DIFFERENCE` | `INFO` |
| `EXPECTED_SEMANTIC_DIFFERENCE` | `WARNING` |
| `LEGACY_MISSING` | `WARNING` |
| `CANONICAL_MISSING` | `WARNING` |
| `IDENTITY_MISMATCH` | `CRITICAL` |
| `VALUE_MISMATCH` | `ERROR` |
| `ORDER_MISMATCH` | `ERROR` |
| `ERROR_MISMATCH` | `ERROR` |
| `UNKNOWN` | `ERROR` |

Concept-specific policy may later add stronger operator handling.

## Sampling

High-volume comparisons may use deterministic sampling.

A partial sample requires a stable sampling key or correlation ID.

Sampling decisions use SHA-256 and do not add raw IDs to metric dimensions.

Critical identity validation may not use partial sampling.

A critical identity comparison configured below 100 percent raises a policy
error.

The framework can also be disabled entirely.

## Cancellation

The framework accepts an `AbortSignal`.

An already-aborted comparison is skipped.

The signal is checked again after bounded canonicalization/classification.

The comparison is synchronous and does not launch background work.

## Bounds

The default serialized representation limit is 64 KiB per side.

The caller may configure a smaller limit or a larger limit up to 1 MiB.

A representation outside the configured bound becomes `UNKNOWN`.

The diagnostic store is a bounded process-local window with a default capacity
of 100 and a hard maximum of 10,000.

No compared payload is retained in that diagnostic window.

## Metrics

The framework uses the existing compatibility metric contract:

```text
SHADOW_COMPARISONS
SHADOW_MISMATCHES
COMPATIBILITY_LATENCY
```

The M04 bounded dimensions remain unchanged:

- concept
- entity type
- route template
- operation
- compatibility mode
- result
- application version
- source schema version

Raw entity IDs and correlation IDs are not metric dimensions.

A skipped comparison records `SHADOW_COMPARISONS` with result `SKIPPED`.

Expected differences use result `DEGRADED`.

Missing-side comparisons use result `NOT_FOUND`.

Unexpected mismatches use result `FAILURE`.

## Authority

The framework requires:

```text
LEGACY
```

or:

```text
CANONICAL
```

for every invocation.

It never selects authority based on comparison outcome.

A mismatch cannot cause a shadow side to overwrite or replace the designated
authoritative result.

## Diagnostics

`ShadowReadDiagnostics` retains only a bounded recent window of findings.

It tracks:

- configured capacity
- total findings recorded
- retained findings

It intentionally does not persist compared payloads.

Durable reconciliation findings remain a later M04 responsibility.

## PR 04E Runtime Effect

PR 04E creates the reusable framework only.

It does not:

- enable a new production shadow-read policy
- change Jellyfin login authority
- alter the 04D lazy mapping policy
- alter inherited write authority
- add a route registry
- add a legacy route adapter
- add reconciliation
- freeze any writer
- delete inherited code

The first production user of the framework must declare its authority,
classification policy, sampling policy, fallback behavior, and removal gate in
its own compatibility PR.

## Rollback

Rollback is code-only.

Remove the shadow framework exports and documentation.

No schema or domain data rollback is required.
