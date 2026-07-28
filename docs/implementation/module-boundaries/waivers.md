# Architecture Waivers

- **Registry:** `scripts/architecture/waivers.json`
- **Schema version:** 1
- **Current milestone:** M02
- **Initial waiver count:** 0

## Policy

A waiver is a temporary, exact exception to one active noncritical import
violation.

Waivers are not a substitute for module ownership or a public interface.

## Required Fields

```json
{
  "id": "WVR-001",
  "ruleId": "MOD-001",
  "source": "server/src/modules/channels/application/service.ts",
  "import": "@/modules/catalog/internal/value.js",
  "owner": "Channels",
  "reason": "Temporary adapter pending the M05 catalog port.",
  "expiresMilestone": "M05"
}
```

Every field is required.

## Exact Matching

The registry matches:

```text
ruleId + source + import
```

Wildcards are prohibited in `source` and `import`.

Broad directory or package exemptions are prohibited.

## Expiration

`expiresMilestone` uses `MNN` form.

During M02, an expiry of `M02` or earlier is invalid. An exception must point to
a future removal milestone.

## Critical Rules

The registry rejects waivers for:

```text
MOD-004
MOD-005
MOD-006
```

## Stale Entries

An unused waiver fails the architecture command. This prevents resolved
violations from leaving permanent dormant exceptions.

## Review Requirements

A waiver change must state:

- Why a public interface cannot be added in the current PR
- The responsible owner
- The removal milestone
- The exact import being permitted
- Why the rule is noncritical
- The rollback effect

## Initial Registry

PR 02A starts with an empty registry:

```json
{
  "schemaVersion": 1,
  "waivers": []
}
```
