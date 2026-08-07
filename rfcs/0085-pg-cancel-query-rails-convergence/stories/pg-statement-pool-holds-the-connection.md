---
title: "PG StatementPool holds the connection, not a pinned client (retires _detach/onIssue)"
status: draft
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails' `PostgreSQL::StatementPool` holds a bare `pg.Client`; Rails' holds the
**connection** (the adapter) and reaches its raw handle at dealloc time:

```ruby
# activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:294-316
class StatementPool < ConnectionAdapters::StatementPool
  def initialize(connection, max)
    super(max)
    @connection = connection
    @counter = 0
  end
  private
    def dealloc(key)
      # This is ugly, but safe: the statement pool is only
      # accessed while holding the connection's lock. (And we
      # don't need the complication of with_raw_connection because
      # a reconnect would invalidate the entire statement pool.)
      if conn = @connection.instance_variable_get(:@raw_connection)
        conn.query "DEALLOCATE #{key}" if conn.status == PG::CONNECTION_OK
      end
    rescue PG::Error
    end
end
```

Because Rails re-reads `@raw_connection` on every `dealloc`, a swapped or closed
connection needs no bookkeeping. trails pins the client at construction instead,
which forces two inventions with no Rails counterpart, both in
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`:

- `_client` + `_detach()` — nulls the pinned client so a late DEALLOCATE can't
  race a client already back in the pg.Pool. Six call sites
  (`this._statementPool?._detach()`), each immediately followed by
  `this._statementPool = null`. Rails needs none of this: the `if conn` guard
  plus `conn.status == PG::CONNECTION_OK` is the whole check.
- `onIssue` — a third constructor argument added by PR #6202 so `dealloc` can
  flip the adapter's `_commandSettled` before its `client.query` (the RFC 0085
  invariant from `pg-command-settled-not-flipped-at-every-issue-site`). With the
  adapter in hand the pool sets the flag directly and the callback disappears.

## Converged shape

`constructor(connection: PostgreSQLAdapter, maxSize)`, matching
`postgresql_adapter.rb:295`. `dealloc` reads the adapter's live `_rawConnection`
at call time, skips when it is null or closed (Rails' `conn.status` guard), flips
`_commandSettled`, and swallows errors (Rails' `rescue PG::Error`).

Deletes: `_client`, `_detach()` and its six call sites, the `onIssue` ctor
argument and `buildStatementPool`'s closure. Also revisit
`GenericStatementPool#delete`'s `T | undefined | Promise<T | undefined>` return
(`statement-pool.ts`) — the union exists only because the PG dealloc is async;
Rails' `#delete` returns the statement (`statement_pool.rb:53-58`).

Note the ordering constraint PR #6202 established and must keep: the eviction
DEALLOCATE is awaited _at the eviction site_ (`statement_pool.rb:31`), and a
`clear()` evicting N entries chains them so two never share a busy socket.

## Acceptance criteria

- [ ] `StatementPool`'s first constructor parameter is the adapter, per
      `postgresql_adapter.rb:295`.
- [ ] `dealloc` reads the adapter's raw connection at dealloc time and guards on
      it being open, per `postgresql_adapter.rb:307-313`.
- [ ] `_client`, `_detach()` and `onIssue` are gone; no call site remains.
- [ ] `_commandSettled` is still flipped immediately before the DEALLOCATE
      (RFC 0085 invariant), now from inside `dealloc`.
- [ ] A `--trace-deprecation` run of `packages/activerecord/src/adapters/postgresql/`
      and `packages/activerecord/src/connection-adapters/` emits no
      `already executing a query` warning.
