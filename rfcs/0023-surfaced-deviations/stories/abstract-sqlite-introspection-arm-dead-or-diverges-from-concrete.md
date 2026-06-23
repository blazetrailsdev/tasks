---
title: "Abstract SchemaStatements sqlite introspection arm is dead/divergent vs concrete SQLite3 adapter"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3958
claim: "2026-06-23T03:07:16Z"
assignee: "abstract-sqlite-introspection-arm-dead-or-diverges-from-concrete"
blocked-by: null
---

## Context

Surfaced during review of #3945 (sqlite-pragma-introspection-quote-table-name).
The abstract `SchemaStatements` mixin has a `"sqlite"` arm in `columns()`,
`indexes()`, and `primaryKey()` that interpolates the table name into PRAGMA
statements (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:948`,
`:1063`, `:1066`, `:1118`). #3945 made these use `_qt`/`quote` faithfully.

However, the concrete `AbstractSQLite3Adapter` (`sqlite3-adapter.ts:1874`,
`:1893`, and `indexes`) fully **overrides** `columns()` / `indexes()` /
`primaryKey()`, so in production the abstract sqlite arm is never reached — it
is effectively dead code that only test stubs exercise.

Worse, the two implementations diverge on schema-qualified names:

- Concrete adapter uses the Rails-faithful `PRAGMA schema.table_info(table)`
  form via `_splitTableName` + `quoteColumnName` prefix, which works for
  attached databases (e.g. `aux.widgets`). See
  `sqlite3-introspection.test.ts:128` ("introspection PRAGMAs work against
  schema-qualified names").
- Abstract arm emits `PRAGMA table_info("aux"."widgets")` (after #3945's
  `quote_table_name`), which SQLite treats as one bare table name and returns
  zero rows — the exact regression that test guards against.

So the abstract arm is both dead and wrong for the schema-qualified case.

## Acceptance criteria

- [ ] Decide and document: either remove the dead `"sqlite"` arm from the
      abstract `columns()`/`indexes()`/`primaryKey()` (since the concrete
      adapter always overrides), or converge it to the concrete adapter's
      `PRAGMA schema.table_info(...)` schema-prefix form so the two cannot
      drift.
- [ ] If removed, drop the now-orphaned `SqliteCapturingAdapter` tests in
      `schema-statements-on-adapter.test.ts` that only exist to cover the
      abstract arm; if converged, add a schema-qualified expectation there.
- [ ] No production behavior change for the concrete SQLite3 adapter path.
- [ ] api:compare / test:compare delta non-negative.
