# ChannelForge Transaction Policy

- **Milestone:** 03
- **Status:** Accepted

## Connection Model

ChannelForge persistence exposes a bounded connection manager.

The version 1 deployment assumption remains one application instance with short
SQLite transactions.

Direct connection construction is infrastructure-level plumbing; application
composition must use bounded ownership.

## Write Mode

Write transactions use `BEGIN IMMEDIATE` semantics through Better SQLite3.

This acquires write intent predictably rather than allowing a deferred
transaction to fail unexpectedly after work has begun.

## Commit and Rollback

Successful callbacks commit.

Thrown failures roll back the complete transaction.

Target writes and a migration checkpoint share one transaction when they
represent one migration batch.

## Busy Handling and Timeout

Every normal connection receives a bounded SQLite `busy_timeout`.

Default:

```text
5000 ms
```

M03 does not add an unbounded application retry loop.

A later retry policy must remain bounded and observable.

## Nested Transactions

Hidden nested transactions are prohibited.

Savepoints remain deferred until a concrete composition requirement exists.

## External Work Prohibition

Transaction context does not expose provider clients.

Provider calls, network requests, FFmpeg, and long-running file processing occur
outside the write transaction.

## Duration

Transactions are expected to remain short.

The roadmap's 250 ms duration value remains a warning target rather than a
universal failure threshold.

## Metrics

M03 proves transaction success, rollback, nesting rejection, failure injection,
and bounded connection/lock behavior through tests.

Production transaction latency and lock-wait metrics are integrated with the
later observability runtime rather than creating a second metrics subsystem here.

## Shutdown

The connection manager owns deterministic close and `closeAll` behavior.

Shutdown must stop new work, finish or abort the active synchronous operation,
then close managed SQLite connections.
