---
title: "rawExecute wraps performQuery in log(), making log the single sql.active_record emitter"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
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
