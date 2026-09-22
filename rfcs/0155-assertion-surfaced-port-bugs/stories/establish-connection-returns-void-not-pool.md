---
title: "establish-connection-returns-void-not-pool"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#7876 while converging `a class using custom pool and switching back to primary` (`packages/activerecord/src/connection-adapters/connection-handler.test.ts`). Rails `connection_handler_test.rb:282-292` does `pool = klass2.establish_connection(...)` and asserts on `pool.lease_connection`.

Rails `connection_handling.rb:50-54` returns `connection_handler.establish_connection(...)`, i.e. the pool. trails `establishConnection` (`connection-handling.ts:538-559`) is `Promise<void>`, discarding the pool `establishWithDbConfig` builds. The test reads it back via `Klass2.connectionPool()` instead.

## Acceptance criteria

`Base.establishConnection` resolves to the established pool; the test uses the return value.
