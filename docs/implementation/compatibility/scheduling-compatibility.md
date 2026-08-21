# Scheduling Compatibility Policy

## Scope

PR 04K establishes the containment boundary for inherited Tunarr scheduling
while ChannelForge scheduling becomes canonical in later milestones.

This unit defines contracts and pure compatibility behavior. It does not wire a
new production scheduler authority.

## Scheduler Modes

The scheduling boundary recognizes exactly four scheduler modes:

- `LEGACY_AUTHORITATIVE`
- `SHADOW_CANONICAL`
- `CANONICAL_AUTHORITATIVE`
- `FROZEN`

Mode changes are explicit records with transition identity, previous mode, next
mode, actor, reason, and timestamp. The compatibility boundary never performs
an implicit mode transition.

## Authority

Approved Schedule Plans are canonical immutable state.

A healthy `CANONICAL_AUTHORITATIVE` read returns the approved canonical schedule
artifact and does not call the inherited scheduler, even when a degraded
fallback policy exists.

`SHADOW_CANONICAL` keeps the canonical artifact authoritative. Legacy schedule
output is diagnostic comparison input only.

`LEGACY_AUTHORITATIVE` is an explicit compatibility mode for pre-cutover legacy
authority.

`FROZEN` contains inherited scheduling and serves the approved canonical
artifact without consulting legacy scheduling.

## Read Compatibility

Legacy scheduling may be read only for:

1. explicit legacy-authoritative operation;
2. shadow comparison; or
3. explicit degraded-state fallback after the approved canonical artifact is
   unavailable.

Degraded fallback requires an affirmative policy and a non-empty reason.

The scheduling boundary performs no provider calls and no FFmpeg work.

## Shadow Comparison

Comparison is evaluated over the caller-supplied fixed horizon and tolerance
policy.

The compatibility projection compares bounded classifications for:

- ordering;
- start time;
- duration;
- content identity;
- filler insertion; and
- redirects.

Shadow comparison never changes the effective schedule artifact.

Divergence records contain only bounded result codes and entry counts. Raw
schedule payloads and channel identifiers are not retained by the comparator.

## Write Compatibility

Approved Schedule Plans remain outside the legacy projection writer contract.

The legacy projection writer receives only:

- legacy channel identity;
- schedule version; and
- the already-approved schedule artifact.

A future production scheduling compatibility write must execute through the M04
write-status coordinator introduced in PR 04H. A legacy projection failure must
leave canonical approval valid, record degraded compatibility state, and enqueue
reconciliation rather than roll canonical state back.

PR 04K does not activate a concrete legacy schedule projection writer.

## Metrics

Scheduling compatibility uses bounded dimensions only.

Counters added by PR 04K are:

- `LEGACY_SCHEDULE_READS`
- `LEGACY_SCHEDULE_FALLBACKS`
- `SCHEDULE_SHADOW_COMPARISONS`
- `SCHEDULE_SHADOW_DIVERGENCES`

Raw ChannelForge channel IDs, legacy channel IDs, schedule IDs, content IDs, and
schedule versions are not metric dimensions.

## Activation and Rollback

PR 04K changes no production scheduler authority and activates no production
fallback.

Rollback is code-only: stop consuming the scheduling compatibility contracts
and boundary. No schema rollback or data rollback is required.
