# Compatibility Reconciliation Policy

- **Milestone:** 04 â€” Legacy Compatibility
- **Unit:** PR 04I â€” Reconciliation Framework
- **Production cutover:** none
- **Authority transition:** none
- **Legacy write freeze:** not activated

## Purpose

Reconciliation compares and repairs compatibility representations after
explicitly detected divergence.

It is a recovery mechanism.

It is not an alternate write authority.

## Authority Rule

Canonical state must never be overwritten from legacy state by ordinary
reconciliation.

A reconciliation worker may:

- compare canonical and compatibility representations
- repair a derived legacy representation from canonical state
- verify an identity mapping
- record a conflict
- record unsupported state
- request retry
- request operator action

A reconciliation worker must not silently:

- copy legacy state into canonical state
- choose between conflicting canonical candidates
- create a new canonical entity from ambiguous legacy state
- change compatibility mode
- activate or roll back a write freeze
- bypass the owning ChannelForge application command
- perform provider calls inside a persistence write transaction
- start FFmpeg

Canonical repair from legacy evidence requires a separately authorized
migration/application command with its own audit and authority decision.

## Durable State

Migration `0008_compatibility_reconciliation` creates:

```text
cf_compatibility_reconciliation_job
cf_compatibility_reconciliation_finding
```

Jobs survive process restart.

Findings survive process restart.

No legacy table is deleted or changed by the migration.

## Job States

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELED
```

Normal execution is:

```text
QUEUED
  -> RUNNING
  -> QUEUED      incomplete batch / retry
  -> COMPLETED   work exhausted
  -> FAILED      terminal worker failure
  -> CANCELED    operator cancellation
```

A process restart converts interrupted `RUNNING` jobs back to `QUEUED`.

The persisted checkpoint and processed count remain intact.

## Idempotent Enqueue

Only one active `QUEUED` or `RUNNING` job may exist for a
`(concept_type, subject_key)` pair.

Repeated enqueue for the same active scope returns the existing job.

After a terminal state, a later divergence may create a new job.

## Bounded Execution

The framework processes exactly one batch per runner invocation.

Default batch size:

```text
100
```

Maximum permitted batch size:

```text
500
```

An incomplete batch must:

- compare at least one item
- return a non-blank durable checkpoint
- return outcome counts that exactly equal the number compared

This prevents unbounded scans and zero-progress restart loops.

## Retry

Default attempt ceiling:

```text
5
```

Maximum configurable attempt ceiling:

```text
20
```

Retryable worker failure below the ceiling returns the job to `QUEUED`.

Failure at the ceiling becomes `FAILED`.

A worker contract violation is terminal and uses:

```text
COMPATIBILITY_TRANSLATION_FAILED
```

A transient worker/runtime failure defaults to:

```text
COMPATIBILITY_UNAVAILABLE
```

Concept-specific workers may supply a more specific stable compatibility error
descriptor.

Workers must be idempotent because a process may stop after an external repair
but before the checkpoint is persisted.

## Cancellation

Cancellation is safe at a bounded batch boundary.

If cancellation is observed after a worker batch returns but before findings or
job completion are persisted, the framework performs no further batch-state
mutation.

Concrete workers must keep each batch bounded and idempotent.

Cancellation does not imply rollback of a repair that was already durably
completed by a worker.

## Findings

Finding severities are:

```text
INFO
WARNING
ERROR
CRITICAL
```

Finding outcomes are:

```text
EQUAL
LEGACY_REPAIRED
CANONICAL_REPAIR_REQUIRED
CONFLICT
UNSUPPORTED
RETRY
OPERATOR_ACTION
```

A finding has a stable `finding_key` within its job.

Repeated observation of the same key updates that finding and increments its
attempt count instead of creating an unbounded duplicate stream.

Finding status is:

```text
OPEN
RESOLVED
```

## Operator Visibility

The read-only diagnostics surface provides bounded:

- queue depth
- oldest open finding timestamp
- oldest open finding age
- recent jobs
- open findings

The diagnostics service does not mutate reconciliation state.

Authorization for an eventual HTTP/CLI operator surface remains the
responsibility of the host interface that exposes these diagnostics.

## Metrics

PR 04I records:

```text
RECONCILIATION_ITEMS_COMPARED
RECONCILIATION_EQUAL
RECONCILIATION_REPAIRED
RECONCILIATION_CONFLICTS
RECONCILIATION_FAILED
RECONCILIATION_RETRIES
RECONCILIATION_QUEUE_DEPTH
OLDEST_RECONCILIATION_FINDING_AGE_SECONDS
RECONCILIATION_DURATION
```

Metrics use only the existing bounded compatibility dimensions.

Raw ChannelForge IDs, legacy IDs, subject keys, correlation IDs, and finding IDs
are not metric dimensions.

Metric failure must not change reconciliation authority or job state.

## Current Activation

PR 04I installs framework and persistence only.

No production concept is assigned a concrete reconciliation worker by 04I.

The current production read and write authorities therefore remain unchanged.

## Rollback

Rollback of PR 04I means:

1. stop invoking the reconciliation runner
2. stop exposing reconciliation diagnostics
3. leave additive reconciliation job/finding history intact
4. retain 04H compatibility write status
5. do not delete legacy or canonical state

A later forward migration may resume queued work from persisted checkpoints.
