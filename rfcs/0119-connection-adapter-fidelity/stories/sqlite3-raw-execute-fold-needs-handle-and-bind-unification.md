---
title: "Unify sqlite3's raw connection handle and driver binds so raw_execute can fold onto the abstract"
status: done
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 7522
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working `async-overrides-of-synchronous-rails-adapter-methods`
(RFC 0119) in PR #7519. That story could not converge either of its two
remaining `sqlite3-adapter.ts` receipts, and this is the prerequisite both are
blocked on. It is NOT the `verifyBang` receipt (see below) — it is the
`rawExecute` half.

Rails defines `raw_execute` once, privately, on `DatabaseStatements`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-560`):

```ruby
def raw_execute(sql, name = nil, binds = [], prepare: false, async: false, allow_retry: false, materialize_transactions: true, batch: false)
  type_casted_binds = type_casted_binds(binds)
  log(sql, name, binds, type_casted_binds, async: async) do |notification_payload|
    with_raw_connection(allow_retry: allow_retry, materialize_transactions: materialize_transactions) do |conn|
      perform_query(conn, sql, binds, type_casted_binds, prepare: prepare, notification_payload: notification_payload, batch: batch)
    end
  end
end
```

sqlite3 has **no** `raw_execute` override upstream — it supplies only
`perform_query` (`sqlite3/database_statements.rb:78-97`), which binds
`type_casted_binds` directly at `:84` and `:97`.

trails' abstract `rawExecute`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1086-1107`)
and `withRawConnection`
(`connection-adapters/abstract-adapter.ts:1827-1885`) are both fully ported and
already async, so **asyncness is not what blocks the fold** — the story title
is misleading on this one member. Two other things do:

1. **The handle lives in the wrong field.** sqlite3 keeps its driver handle in
   its own `_rawConnection` (24 references in `sqlite3-adapter.ts`) beside the
   base `_connection`, which is typed `AbstractAdapter | null`. The abstract
   path reaches the handle through `rawConnectionForBlock()`
   (`abstract-adapter.ts:1888`), which returns `this._connection` and which **no
   adapter currently overrides**. So `withRawConnection` hands the block the
   wrong object for sqlite3 and the base `rawExecute` is unusable there.
2. **The binds are a second, invented list.** sqlite3's override passes
   `binds.map(_driverBind, this)` to `performQuery` where Rails passes
   `type_casted_binds`. Two lists exist where Rails has one; the same invented
   second list was already found on the mysql2 side (it is what the
   prepared-statements-only lane catches when it reds).

## Converged shape

- Reach the handle through `rawConnectionForBlock()` — either by widening the
  base field or by overriding that hook in `sqlite3-adapter.ts` — so
  `withRawConnection` yields the sqlite3 driver handle, as
  `abstract_adapter.rb`'s `yield @raw_connection` does.
- Make sqlite3's `typeCastedBinds` produce what the driver binds, retiring
  `_driverBind` as a separate list, so `performQuery`'s 4th argument is
  `type_casted_binds` on both sides as `sqlite3/database_statements.rb:78`
  declares.
- Then delete the `rawExecute` override in `sqlite3-adapter.ts` and its
  `@noRailsEquivalent CONVERGEABLE async-overrides-of-synchronous-rails-adapter-methods`
  receipt, letting the abstract body run.

## Out of scope

The sibling `verifyBang` receipt in the same file is a **different** blocker and
must not be folded into this story: it cannot converge by draining the pending
async open in `active?`, because every pool checkout asks `active?` and that
turns a lazy adapter eager — tried and reverted in PR #7304, and pinned by six
tests in `packages/activerecord/src/sqlite-adapter.trails.test.ts`.

## Acceptance criteria

- [ ] `sqlite3-adapter.ts` declares no `rawExecute` override; the abstract
      `rawExecute` serves sqlite3.
- [ ] `performQuery` receives `type_casted_binds`, not a separately-derived
      driver list; `_driverBind` is gone or is the implementation of
      `typeCastedBinds`.
- [ ] The `@noRailsEquivalent CONVERGEABLE` receipt on that override is deleted.
- [ ] SQLite lanes green, including `packages/activerecord/src/sqlite/**`.
