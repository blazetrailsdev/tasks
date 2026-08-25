---
title: "Retire the standalone SchemaStatements companion construction sites"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5847
claim: "2026-08-02T00:56:47Z"
assignee: "retire-standalone-schema-statements-construction"
blocked-by: null
closed-reason: null
---

## Context

With `AbstractAdapter#schemaStatements()` gone (PR #5841), the DDL bodies are the
adapter's own methods — Rails' `include SchemaStatements`
(`abstract_adapter.rb:35`). Two trails call sites still build a _standalone_
`SchemaStatements` companion, which Rails has no analogue for:

- `packages/activerecord/src/schema-introspection.ts:73` — `schemaStatementsFor()`
  memoizes `new SchemaStatements(adapter)` per adapter and routes
  `introspectTables` / `introspectColumns` / `introspectIndexes` /
  `introspectForeignKeys` through it whenever the adapter does not answer
  `tables()` / `columns()` / … directly. Every real adapter now carries those
  members from the mixin, so the fallback is dead weight standing in for a shape
  that cannot occur; the `hasTables` / `hasPrimaryKey` / `hasForeignKeys`
  predicates guarding it are the same invention.
- `packages/activerecord/src/migration.ts:326` — `Migration#schema` still keeps a
  `_schema` / `_schemaConn` memo pair, now caching nothing but the connection
  itself. Rails' `migration.rb:800` just calls through to the connection.

## Acceptance criteria

- `schema-introspection.ts` reaches the adapter members directly, with the
  standalone-companion fallback and its `has*` probes removed (or, if a genuine
  companion-less adapter shape survives, the reason recorded at the call site).
- `Migration#schema` drops the memo and resolves to the connection.
- No standalone `new SchemaStatements(...)` remains outside the class's own
  tests.
