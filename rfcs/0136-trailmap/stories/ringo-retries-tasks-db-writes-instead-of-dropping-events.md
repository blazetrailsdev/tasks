---
title: "ringo implements the write protocol's locked/migrating answer: ack after commit, retry on SQLITE_BUSY"
status: blocked
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#69
claim: "2026-10-12T18:39:42Z"
assignee: "deploy-the-smoke-schedule-on-the-box"
blocked-by: "Mechanism built, acceptance not met: ringo's write path (ack after commit, busy/schema retry with backoff) is on btwhooks main at 0eeb2e1 (webhook/taskswrite.go) with its lock test, but it has no caller and ringo owns no table. Two criteria need a ringo-owned table: a real delivery acked after its row commits, and the table in trailmap's tableOwners. Unblock when the first phase-B story gives ringo a table; that change opens tasksWriteDSN, calls AckAfterCommit from the handler and bumps the pin. Dropped from trailmap#69 on review."
closed-reason: null
---

## Context

trailmap#25 established the shared-SQLite write protocol (`docs/write-protocol.md`, `config/write-protocol.ts` in trailmap). Its "When the database is locked or migrating" section is a REQUIREMENT on ringo, not a description of it: at btwhooks `39cca59c` ringo only opens `tasks.db` read-only (`webhook/tasksdb.go:97`, `webhook/parity.go:172`, `file:…?mode=ro&_pragma=busy_timeout(5000)`) and has no write path, so none of it is implemented.

The first phase-B migration story that gives ringo a table must not land before this, or a trailmap redeploy (or a migration holding the write lock) can drop a webhook event.

## Acceptance criteria

- ringo acknowledges a webhook delivery only after its row is committed, so GitHub redelivers anything unacknowledged.
- `SQLITE_BUSY` after the 5000ms busy timeout is retried with backoff (1s doubling, capped at 30s), never dropped.
- A write failing for a schema reason (`no such column`) during a migration is retried the same way.
- The writable ringo DSN keeps `_pragma=busy_timeout(5000)`, and its table appears as `ringo` in trailmap's `tableOwners`. trailmap's `test/config/write-protocol.test.ts` requires `mode=ro` while ringo owns no table.

## Definition of done

A ringo test holding an exclusive lock on the file past the timeout shows the event is written after release, not lost.

## Verification

Re-vendor ringo into trailmap (`scripts/vendor-ringo.sh`) and `pnpm test` stays green.
