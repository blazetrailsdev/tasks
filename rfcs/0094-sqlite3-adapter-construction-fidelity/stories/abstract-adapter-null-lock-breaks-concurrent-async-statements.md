---
title: "abstract-adapter-null-lock-breaks-concurrent-async-statements"
status: closed
updated: 2026-09-22
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
closed-reason: "Ratified repo-wide by CLAUDE.md 'The adapter lock defaults to a monitor, not NullLock' (#7831). Verified 2026-09-22: porting self.lock_thread = nil into the constructor still reds sqlite-adapter.trails.test.ts 'opens once when several queries race the deferred async-only open' (3 opens vs 1), postgresql-adapter.get-client.trails.test.ts 'resetBang runs ROLLBACK + DISCARD ALL + reconfigure under one lock', and sqlite3-adapter.transactions.trails.test.ts 'writer changes are not visible to reader until committed'. Neither mechanism the acceptance criteria offer can reach those: connect! sits inside @lock.synchronize at abstract_adapter.rb:984-985, upstream of the yielded block _statementLock wraps, and the failing adapters are standalone on a NullPool so there is no lease to arm. The two perform-query insert-id tests the story names now pass on their own, since lastInsertRowId moved inside the statement lock."
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
