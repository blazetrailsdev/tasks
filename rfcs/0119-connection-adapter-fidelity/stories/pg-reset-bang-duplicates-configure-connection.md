---
title: "PG resetBang runs configure_connection twice, duplicating super"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7539
claim: "2026-09-05T22:06:49Z"
assignee: "converge-adapter-args-url-parsing-onto-connection-url-resolver"
blocked-by: null
closed-reason: null
---

## Context

Rails' `PostgreSQLAdapter#reset!`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:371-381`)
is five lines inside the lock:

```ruby
def reset!
  @lock.synchronize do
    return connect! unless @raw_connection

    unless @raw_connection.transaction_status == ::PG::PQTRANS_IDLE
      @raw_connection.query "ROLLBACK"
    end
    @raw_connection.query "DISCARD ALL"

    super
  end
end
```

`super` is `AbstractAdapter#reset!` (`abstract_adapter.rb:725-731`), which does
`clear_cache!(new_connection: true)`, `reset_transaction` and
`attempt_configure_connection`.

trails' override
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`,
`resetBang`) carries the two Rails queries plus a body Rails has no counterpart
for: it clears `_connectionConfigured`, nulls `_client` and `_inTransaction`,
swallows the ROLLBACK with `.catch(() => {})` where Rails lets it raise, calls
`this.configureConnection()` behind a `_rawConnection === live && !this._closed`
guard with a teardown `catch` that nulls the raw connection and ends the client,
and calls `this._statements.reset()` — before finally calling
`super.resetBang()`.

The inline `configureConnection()` duplicates what `super` reaches through
`attempt_configure_connection`, so **`configureConnection` runs twice per
reset**, re-issuing the whole `SET` block. `_statements.reset()` likewise
duplicates `clear_cache!(new_connection: true)`. Rails does neither: it delegates
both to `super`.

Surfaced by PR #7257 (`reset-bang-cannot-propagate-configure-failure`), which
made `resetBang` async so the failure propagates. That PR deliberately did not
touch the body — its story is propagation, and converging the body is a
behaviour change on the PG connect path. Before #7257 the second configure's
outcome was swallowed by a `.catch(() => {})`, which is part of why the
duplication went unnoticed.

## Converged shape

`resetBang` mirrors `postgresql_adapter.rb:371-381`: the `connect!` early
return, the `PQTRANS_IDLE` guard around `ROLLBACK` (unswallowed), `DISCARD ALL`,
then `super` — with the cache reset and the reconfigure left to
`AbstractAdapter#resetBang` where Rails leaves them. Establish for each removed
line whether it is load-bearing for the pg driver (the `_client` /
`_connectionConfigured` bookkeeping may be, since trails holds a persistent
client Rails' PG::Connection does not); anything that must stay is justified at
its call site with a Rails `file:line`.

## Acceptance criteria

- [ ] `configureConnection` runs once per `resetBang`, reached through
      `super`/`attemptConfigureConnection` as `postgresql_adapter.rb:380` does.
- [ ] The inline `_statements.reset()` is gone, or justified at the call site.
- [ ] The `ROLLBACK` `.catch(() => {})` is gone — Rails lets that query raise.
- [ ] Any surviving trails-only bookkeeping carries a call-site Rails cite.
- [ ] PG lane green (`ARCONN=postgresql`), including
      `postgresql-adapter.trails.test.ts`'s four reset cases.
