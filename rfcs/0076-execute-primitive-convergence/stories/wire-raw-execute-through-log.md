---
title: "rawExecute wraps performQuery in log(), making log the single sql.active_record emitter"
status: ready
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
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

> **PR #6311 (merged 2026-08-10) landed only the abstract `rawExecute`/`log`
> primitive.** Adapter routing, the `internalExecQuery` log wrap and the
> ddl-profile update all remain — see the Progress section at the bottom.
>
> **Update: PR #6327 took the `internalExecQuery` log wrap.** Review there
> required it, so `internalExecQuery` (and `rawExecQuery`) are now bare
> `cast_result(...)` calls. The `set_query` concern that justified keeping the
> wrap is unfounded: `AbstractAdapter#log`'s rescue already does
> `ex.setQuery(sql, binds)` (abstract_adapter.rb:1145), which
> `internal_execute` → `raw_execute` reaches. What remains here is adapter
> routing and the ddl-profile update.

## Context

Rails' `raw_execute` wraps `perform_query` in `log(...)`, and that is the ONLY
place `sql.active_record` is emitted on the query path
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-559`):

```ruby
def raw_execute(sql, name = nil, binds = [], prepare: false, async: false, ...)
  type_casted_binds = type_casted_binds(binds)
  log(sql, name, binds, type_casted_binds, async: async) do |notification_payload|
    with_raw_connection(...) do |conn|
      perform_query(conn, sql, binds, type_casted_binds, prepare: prepare,
                    notification_payload: notification_payload, batch: batch)
    end
  end
end
```

trails' `rawExecute` (`abstract/database-statements.ts:1847`) calls
`withRawConnection` -> `performQuery` directly and never calls `log`. As of
PR #4892, `AbstractAdapter#log` (`abstract-adapter.ts:2345`) is faithful and
yields the notification payload — but it has **zero production callers**. Each
adapter instead hand-rolls its own `Notifications.instrumentAsync("sql.active_record", payload, ...)`
inside `execute`/`executeMutation` (`sqlite3-adapter.ts:476,585,722,788`;
`postgresql-adapter.ts:986,1637,1732,1793,2180`; `mysql2-adapter.ts:639,923,988,1174`),
each rebuilding the payload by hand. PG's `performQuery` already accepts a
`notificationPayload` (`postgresql/database-statements.ts:123-135`) and today
always receives `undefined`.

Deliberately deferred from #4892 (see its PR body): `internalExecute`
(`abstract/database-statements.ts:1951`) is `rawExecute`'s one live caller and is
used by savepoints (`abstract/savepoints.ts:66,81,94`) and mysql2 `BEGIN` /
isolation-level (`mysql2-adapter.ts:1047,1084,1087`). Making `rawExecute` emit
`sql.active_record` is therefore a real behavioural change — those statements
would start producing notifications — with blast radius on any test asserting
notification counts, plus `test-helpers/ddl-profile.ts`, which deliberately
patches only `execute`/`executeMutation` as "the two leaf primitives".

Depends on `unify-execute-mutation-into-perform-query`: `performQuery` is
currently assigned on PG's prototype only (`postgresql-adapter.ts:5244`), so
`rawExecute` raises `NotImplementedError` on sqlite3/mysql2 today.

## Acceptance criteria

- [ ] `rawExecute` wraps its `withRawConnection`/`performQuery` call in
      `this.log(...)`, threading `notificationPayload` into `performQuery`,
      matching `database_statements.rb:552-559`.
- [ ] Adapters stop hand-rolling `sql.active_record` payloads in
      `execute`/`executeMutation`; `log` becomes the single emitter, so
      `row_count`/`statement_name` are reported by mutating the yielded payload
      (the seam added in #4892).
- [ ] Reconcile the double-instrumentation risk: confirm no path emits
      `sql.active_record` twice once both `log` and a hand-rolled site are live
      during the transition.
- [ ] Decide and record what savepoint / `BEGIN` statements should emit — Rails
      logs them with `name: "TRANSACTION"`; today trails does not notify at all
      for the abstract path.
- [ ] Update `test-helpers/ddl-profile.ts`, whose "patch only the two leaf
      primitives, executeBatch re-dispatches through them" assumption
      (`ddl-profile.ts:19,252-260`) breaks once `rawExecute`/`log` is the leaf.
- [ ] Tests: a query emits exactly one `sql.active_record` with the correct
      `row_count`, sourced from the payload the block mutated.

## Progress — PR #6311 landed the abstract primitive (2026-08-10)

Done:

- `rawExecute` (`abstract/database-statements.ts`) now wraps its
  `withRawConnection`/`performQuery` call in `this.log(...)` and threads
  `notificationPayload` into `performQuery`, matching
  `database_statements.rb:552-559`. Its `name` / `isAsync` parameters are live.
- `rawExecQuery` dropped its own `log` wrap — Rails' `raw_exec_query` is
  `cast_result(raw_execute(...))` (`:541-543`), so keeping both would emit
  `sql.active_record` twice.
- The `raw_execute` → `log` call-mismatch baseline row is converged and deleted.
- Covered by `database-statements.test.ts`: one query, exactly one
  `sql.active_record`, `row_count` read off the payload `performQuery` mutated.

Also re-established, since the story's Context predates it: the adapters have
**already** stopped hand-rolling `Notifications.instrumentAsync` payloads. A
sibling PR moved `sqlite3-adapter.ts`, `postgresql-adapter.ts` and
`mysql2-adapter.ts` onto `this.log(...)` with the payload threaded into a
private `_performQuery`, so `log` IS the single payload producer today. The
criterion that reads "adapters stop hand-rolling payloads" is satisfied; what
is left is the _layering_, below.

**This story stays open for the adapter routing:**

- No adapter exposes `performQuery` at the Rails name — each keeps a private
  `_performQuery` under its own `log` (`sqlite3-adapter.ts:461`,
  `postgresql-adapter.ts:1724`, `mysql2-adapter.ts:970,1013`) — so the shared
  `rawExecute` still raises `NotImplementedError`
  (`database_statements.rb:561`) and nothing reaches it. Rails' path is
  `internal_execute -> raw_execute -> log -> with_raw_connection ->
perform_query`; converging it means renaming `_performQuery` →
  `performQuery` on three adapters, deleting three `log` call sites, and
  re-deriving where `preprocessQuery` and `materializeTransactions` run on each.
- `internalExecQuery` still wraps in `log` where Rails does not
  (`database_statements.rb:546-548`). The abstract body is reached only by a
  host that overrides `internalExecute` but NOT `internalExecQuery`, and for
  such a host `log`'s rescue is the only thing attaching `set_query` to a
  translated `StatementInvalid` (asserted by an existing unit test) — so the
  wrap comes out only once the adapters route through `rawExecute`.
- `support/ddl-profile.ts` (`:16`, `:252-260`) is still ACCURATE as written:
  `execute`/`executeMutation` remain the leaf primitives on every live path
  precisely because `rawExecute` has no callers. Editing it before the adapters
  move would make the profiler describe a layering that does not exist and
  silently stop profiling DDL. It moves in the same PR as the adapters.
- The savepoint / `BEGIN` `name: "TRANSACTION"` notification decision only
  becomes observable once the adapters route through `rawExecute`, so it
  travels with them too.
