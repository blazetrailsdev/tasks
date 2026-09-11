---
title: "abstract-adapter-null-lock-breaks-concurrent-async-statements"
status: draft
updated: 2026-09-11
rfc: "0094-sqlite3-adapter-construction-fidelity"
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

## Context

Rails' `AbstractAdapter#initialize` ends with `self.lock_thread = nil`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:157`),
which selects `ActiveSupport::Concurrency::NullLock` (`:172-181`). The pool
re-arms a real monitor only when it pins a connection
(`connection_pool.rb` `lock_thread=`; trails `abstract/connection-pool.ts:481`).

The bundle PR for `abstract-adapter-initialize-drops-logger-and-lock-thread`
ported the logger half. Adding `this.setLockThread(null)` to the constructor
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, after
`buildStatementPool()`) reds three tests:

- `adapters/sqlite3/sqlite3-adapter-perform-query.trails.test.ts` —
  "returns distinct insert ids for concurrent inserts" (24 vs 25 ids) and
  "returns the rowid of each of two RETURNING inserts issued together" ([2,2]).
- `sqlite-adapter.trails.test.ts` — "opens once when several queries race the
  deferred async-only open".

Ruby never shares one un-pinned connection between threads, so NullLock is
safe there. In trails, concurrent promises in one execution context share a
single adapter, and the `LoadInterlockAwareMonitor` field default is what
serializes their statements. The lock is doing real work that Rails gets from
thread-ownership of connections.

## Acceptance criteria

- [ ] Constructor calls `this.setLockThread(null)` at `abstract_adapter.rb:157`'s
      position.
- [ ] Concurrent statements on one adapter stay serialized by whatever Rails'
      shape allows (e.g. the statement-level `_statementLock` in SQLite3, or the
      pool's lock_thread arming), so the three tests above stay green.
