---
title: "disconnectBang takes no lock, fire-and-forgets clearCacheBang, and nils _connection in the abstract body"
status: ready
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `AbstractAdapter#disconnect!` runs its whole body under the adapter's own
lock (`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:700-706`):

```ruby
def disconnect!
  @lock.synchronize do
    clear_cache!(new_connection: true)
    reset_transaction
    @raw_connection_dirty = false
  end
end
```

Note also what it does NOT do: it never nils `@raw_connection`. The adapter
subclass does that after `super` — sqlite3 at `sqlite3_adapter.rb:221-226`.

trails' port
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1075-1080`)
takes no lock, fires the async `clearCacheBang` as `void` (unawaited), and nils
`this._connection` in the abstract body:

```ts
disconnectBang(): void {
  void this.clearCacheBang({ newConnection: true });
  this.resetTransaction();
  this._rawConnectionDirty = false;
  this._connection = null;
}
```

Observed consequence, traced while working
`configure-connection-cannot-service-a-query-on-the-connection-it-configures`
(#7592): a pool disconnect can yank the connection out from under an in-flight
query. `ConnectionPool#_disconnect` -> `disconnectBang` sets `_connection = null`
synchronously and only THEN blocks (inside `clearCacheBang`) on the adapter lock
the running query holds — so the query wakes up to a null `_connection` and
re-enters connect/verify from inside `withRawConnection`. Under Rails' shape the
disconnect would wait for the lock before touching anything.

## Converged shape

`disconnectBang` holds the lock across its three statements, and the
`_connection = null` moves to the subclass overrides that already exist
(sqlite3's `_disconnect`), mirroring `sqlite3_adapter.rb:221-226`.

The obstacle is that trails' `lock.synchronize` is async while `disconnect!` is
sync in Ruby and is called from sync paths — so this needs the settled
`setX()`-style treatment or an awaited caller chain, and the `void`
fire-and-forget on `clearCacheBang` has to go either way (an unawaited cache
clear is its own divergence: Rails' `clear_cache!` completes before
`reset_transaction` runs).

## Acceptance criteria

- [ ] `disconnectBang`'s body runs under `this.lock`, in Rails' statement order,
      with `clearCacheBang` awaited rather than `void`ed.
- [ ] `this._connection = null` is not in the abstract body; the subclass that
      closes the handle nils it, per `sqlite3_adapter.rb:221-226`.
- [ ] A regression cover pins that a disconnect racing an in-flight query cannot
      null `_connection` mid-query (the shape traced in #7592).
- [ ] All three adapter lanes green.
