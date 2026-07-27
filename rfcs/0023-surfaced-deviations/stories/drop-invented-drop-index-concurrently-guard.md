---
title: "removeIndex pre-raises an invented CONCURRENTLY-in-transaction error"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging PG index DDL (#5383).

`PostgreSQLAdapter#removeIndex`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`) throws a
trails-invented error before issuing any SQL:

```ts
if (opts.algorithm === "concurrently" && this._inTransaction) {
  throw new Error("DROP INDEX CONCURRENTLY cannot run inside a transaction");
}
```

Rails has no such guard — `remove_index`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:543-564`)
goes straight to `execute`, and PostgreSQL itself raises
`25001 DROP INDEX CONCURRENTLY cannot run inside a transaction block`. Grepping
the vendored PG adapter for `cannot run inside a transaction` returns zero hits.

PR #5383 removed the identical guard from `addIndex` when that body was rewritten
to route through the schema-creation visitor; the `removeIndex` twin was left
in place as out of scope. Keeping it means the two sibling methods now disagree
about who owns the error, and the invented `Error` is not the
`StatementInvalid` subclass callers would get from the real path.

## Acceptance criteria

- Drop the guard so PostgreSQL owns the rejection, as it already does for
  `addIndex`.
- Confirm the surfaced error is the adapter's translated `StatementInvalid`
  (PG SQLSTATE 25001), not a bare `Error`.
- No test asserts the invented message (there is none today) — if one is added,
  it must assert the PG error.
