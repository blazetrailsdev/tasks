---
title: "sqlite3-execute-mutation-duplicates-driver-binds"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
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

`SQLite3Adapter#executeMutation`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:378-392`)
computes its driver binds twice:

```ts
const driverBinds = binds.map(_driverBind, this) as SqliteBinds;
...
this.typeCastedBinds(binds) ?? [],   // passed to log()
...
await this.performQuery(this._rawConnection, sql, binds, driverBinds, { ... });
```

Since PR #7522 gave `SQLite3Adapter` a `typeCastedBinds` override whose body is
exactly `binds?.map(_driverBind, this)`, the local `driverBinds` is a duplicate
of the value `typeCastedBinds` already returns — the two arrays are now
element-for-element identical, computed twice per mutation.

Rails computes it once. `DatabaseStatements#raw_execute`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-560`)
binds `type_casted_binds = type_casted_binds(binds)` a single time and feeds
that same local to both `log` and `perform_query`.

More broadly, `executeMutation` is itself a hand-rolled re-implementation of
the `raw_execute` → `with_raw_connection` → `perform_query` chain (its own
`ensureConnected` / `materializeTransactions` / `log` / `performQuery`
sequence), which is the shape #7522 removed from `rawExecute`. It should
probably follow `rawExecute` through the abstract chain rather than keep its
own copy — but it also carries an extra `counters` out-parameter for
`lastInsertRowid`, which needs its own Rails cite before folding.

## Acceptance criteria

- `executeMutation` computes its driver binds once, via `typeCastedBinds`, and
  passes that same value to both `log` and `performQuery` — mirroring
  `raw_execute`'s single `type_casted_binds` local.
- Establish whether the surrounding `ensureConnected` / `materializeTransactions`
  / `log` scaffolding can be dropped in favour of the abstract
  `rawExecute` → `withRawConnection` chain, and either fold it or record the
  blocker (the `counters` out-parameter) with a Rails cite.
- sqlite3 adapter suites stay green.
