---
title: "SQLite3 applies dqs_ddl/dqs_dml as pragmas where Rails passes strict at open"
status: done
updated: 2026-09-10
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 11
pr: 7668
claim: "2026-09-10T16:14:17Z"
assignee: "delete-build-adapter-arg-once-constructors-take-config-hash"
blocked-by: null
closed-reason: null
---

## Context

Rails carries the strict-strings setting into the driver as a _connection
parameter_, not as a pragma. `SQLite3Adapter#initialize` puts `:strict` into
`@config` and then into the derived `@connection_parameters`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:125-132`),
and `connect` hands that whole hash to `new_client` (`:846-852`), which passes
`strict:` to the driver at open time. `configure_connection` never mentions
`dqs_ddl` or `dqs_dml` (`:820-844`).

trails instead emits them as two pragmas inside `configureConnection`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`):

```ts
const dqsValue = this._strict ? "OFF" : "ON";
stmts.push(
  [`dqs_ddl = ${dqsValue}`, "SQLite DQS pragma 'dqs_ddl'"],
  [`dqs_dml = ${dqsValue}`, "SQLite DQS pragma 'dqs_dml'"],
);
```

Two consequences. The setting is applied after the handle is already open,
rather than at open time as Rails does; and `dqs_ddl`/`dqs_dml` are not in
`PRAGMA_SETTERS` (they are not ruby-sqlite3 `Pragmas` setters — the gem exposes
strictness through the open call), so they sit outside the gate every other
pragma now goes through.

## Converged shape

Carry `strict` through the connection-parameters hash to the driver's open call,
and delete the two `stmts.push` entries from `configureConnection`, leaving that
method to apply `DEFAULT_PRAGMAS`-merged pragmas only, as
`sqlite3_adapter.rb:837-844` does.

## Dependencies

Depends on `sqlite3-connection-parameters-never-built`, which builds the
`@connection_parameters` hash this setting should travel in. Until that lands
there is nowhere Rails-shaped to put it.

## Acceptance criteria

- [ ] `configureConnection` no longer pushes `dqs_ddl` / `dqs_dml`.
- [ ] Strict-strings reaches the driver at open time via the connection
      parameters, and the existing strict-strings tests still pass.
- [ ] Every statement `configureConnection` applies is a real pragma that passes
      the `PRAGMA_SETTERS` gate.
