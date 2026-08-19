# ChannelForge Audit and Idempotency Foundations

- **Milestone:** 03
- **Schema migration:** `0005_operational_safety`
- **Status:** Initial implementation

## Audit

`cf_audit_record` is append-only application evidence.

The initial audit sink records:

- Branded Audit Record ID
- Timestamp
- Actor type and optional actor ID
- Action
- Target type and optional target ID
- Success/failure outcome
- Optional Migration Run ID
- Optional correlation/request IDs
- Structured JSON details

The initial sink exposes append only.

No update or delete API is provided.

Secret material must not be placed in audit details.

## Idempotency

`cf_idempotency_record` protects critical creation/start commands from duplicate
execution.

The uniqueness scope is:

```text
(scope, actor_id, idempotency_key)
```

An absent actor is represented by the empty string so SQLite uniqueness remains
deterministic.

The request hash is canonical lowercase SHA-256 hex.

Behavior:

- New key + hash -> `STARTED`
- Same key + same hash -> `REPLAY`
- Same key + different hash -> conflict
- `IN_PROGRESS` may transition once to `COMPLETED` or `FAILED`
- Terminal records cannot transition again

Expiry is persisted for later cleanup policy; this unit does not automatically
delete records.
