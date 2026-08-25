---
title: "changeTable's callback type does not narrow to the adapter's Table, forcing casts at every call site"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: TypeScript variance ergonomics (removing 'as PgTable' / 't: any' casts at call sites). No behavioral divergence from change_table; Ruby has no type to converge."
---

## Context

Surfaced by review of PR #5624 (`pg-column-methods-on-change-table-proxy`, RFC 0005).

In Rails, `change_table` yields the adapter's `Table` subclass, so
`t.hstore` / `t.citext` / `t.uuid` are simply in scope inside the block — the
adapter's `update_table_definition` decides the class and Ruby needs no
annotation.

In trails the runtime does the right thing on the adapter-direct path
(`PostgreSQLAdapter#updateTableDefinition`, postgresql-adapter.ts:4731 returns
`PgTable`), but the _type_ does not: `changeTable`'s callback is declared
`(t: Table) => void | Promise<void>` on the `DatabaseAdapter` interface
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:416-420`) and on
`SchemaStatements#changeTable`. Under `strictFunctionTypes` a
`(t: PgTable) => ...` callback is rejected, so every call site that uses an
adapter-specific column method must cast inside the block:

```ts
await connection.changeTable("hstores", async (t) => {
  await (t as PgTable).hstore("users", { default: "" });
});
```

PR #5624 added two such casts (hstore.test.ts, citext.test.ts); the MySQL precedent
is worse, using `async (t: any)` (`adapters/abstract-mysql-adapter/unsigned-type.test.ts:72`).
Narrowing the override directly on `PostgreSQLAdapter` fails the
`implements DatabaseAdapter` check for the same contravariance reason, so this
needs a deliberate approach — e.g. making the adapter interface generic in its
table type, or declaring `changeTable` with a method-shorthand signature (bivariant
parameters) rather than a property with a function type.

## Acceptance criteria

- A `change_table` block on a concrete adapter is typed as that adapter's `Table`
  subclass, so adapter column methods resolve without `as PgTable` / `t: any` casts.
- The existing casts in `adapters/postgresql/hstore.test.ts`,
  `adapters/postgresql/citext.test.ts` and
  `adapters/abstract-mysql-adapter/unsigned-type.test.ts` are removed.
- No loosening of the abstract contract for callers that legitimately hold only an
  abstract `Table`.
- `parity:api` / `parity:test` deltas non-negative.
