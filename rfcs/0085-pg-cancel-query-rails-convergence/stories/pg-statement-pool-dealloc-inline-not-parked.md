---
title: "Deallocate the evicted statement inline, deleting _pendingDeallocate"
status: done
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6202
claim: "2026-08-07T21:04:43Z"
assignee: "api-compare-orphan-buckets-activesupport-core-ext-tail-2"
blocked-by: null
closed-reason: null
---

## Context

PR #6189 retired the pinned-query mutex (`pg-retire-pinned-query-mutex`). The one
ordering the connection lock does not supply by itself is prepared-statement
eviction, and it is currently re-expressed with a trails-only field:

- `_pendingDeallocate` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`,
  assigned in the `_rawConnection` setter's registered dealloc serializer)
- `_drainPendingDeallocate()` (same file), awaited at `_runQuery`'s `attempt()`,
  at `exec()`, and after `pool.set(...)` in `prepareStatement`; `resetBang`
  sequences its ROLLBACK/DISCARD ALL behind the same slot.

Rails needs none of it. `StatementPool#[]=` deallocates the evicted entry
**inline**, synchronously, under `@lock`, before the query that triggered the
eviction is sent:

- `activerecord/lib/active_record/connection_adapters/statement_pool.rb:31`
- `activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:307`
  (`PostgreSQL::StatementPool#dealloc` → `@raw_connection.query "DEALLOCATE ..."`,
  a blocking libpq call)

trails' `StatementPool#dealloc` is sync to mirror Rails' sync `dealloc`, so its
`client.query()` promise cannot be awaited where it is issued — hence the park

- drain. The result is correct (verified: no `already executing a query`
  deprecation across `adapters/postgresql/**` + `connection-adapters/**`), but the
  DEALLOCATE's landing point is a slot the adapter polls rather than the statement
  that issued it.

## Converged shape

One of:

1. Make the eviction path async end-to-end — `dealloc`/`set` return a promise
   that the two eviction call sites (`_preparedNameFor`, `prepareStatement`)
   await, so the DEALLOCATE is awaited _at the eviction_, exactly where Rails
   blocks on it. This is the closer shape; the cost is that
   `GenericStatementPool#set`/`clear`/`setMaxSize` become async, which ripples
   into the mysql2 and sqlite3 pools.
2. Or establish that eviction only ever happens on a client this chain holds the
   lock for, and issue the DEALLOCATE where `_preparedNameFor` runs.

Either way `_pendingDeallocate` and `_drainPendingDeallocate` should be gone.
Note the `clearCacheBang` → `pool.clear()` path: it evicts N entries at once
from a sync method, and a fix must keep them off a busy socket (the first
attempt at #6189 fired them un-chained and reproduced the node-pg
`client.query() ... already executing a query` deprecation via
`changeTableComment`).

## Acceptance criteria

- [ ] `_pendingDeallocate` and `_drainPendingDeallocate` are gone from
      `postgresql-adapter.ts`.
- [ ] The eviction DEALLOCATE is awaited at the eviction site, matching
      `statement_pool.rb:31`.
- [ ] `resetBang` no longer reads a deallocate slot.
- [ ] A `--trace-deprecation` run of `packages/activerecord/src/adapters/postgresql/`
      and `packages/activerecord/src/connection-adapters/` emits no
      `already executing a query` warning.
