---
title: "sqlite3-test-port-busy-handler-timeout-releases-gvl"
status: ready
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# sqlite3: port test_integration_pending.rb "busy handler timeout releases gvl"

## Context

`vendor/sqlite3/v2.6.0/test/test_integration_pending.rb:122-183` runs an "active" Ruby thread that sleeps 5ms in a loop while the main thread is blocked inside `@db.execute` under `busy_handler_timeout = 100`, and asserts the active thread advanced at least 15 times — i.e. the busy handler releases the GVL. trails' sync engines (`packages/sqlite3/lib/engine/better-sqlite3.ts`, `node-sqlite.ts`) block the one JS thread inside `step`, and `setBusyHandlerTimeout` (`packages/sqlite3/lib/database.ts`) spins synchronously, so no other JS work can run during the wait. The two sibling cases (impatient, outwait) were ported sequentially in `packages/sqlite3/test/test-integration-pending.test.ts`.

## Acceptance criteria

- [ ] Either the case is ported (e.g. against an async engine whose busy wait yields to the event loop), or the operator rules it permanently unportable and it is parked as `it.skip` under a `PERMANENT-SKIP:` line citing that ruling.
