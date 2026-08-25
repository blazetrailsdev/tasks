---
title: "Inline the _qi / _qt quoting shorthand into quoteColumnName / quoteTableName"
status: closed
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: no _qi/_qt forwarders or call sites remain on origin/main (git grep '_qi(|_qt(' over packages/ returns nothing; abstract-adapter.ts and abstract/schema-statements.ts spell quoteColumnName/quoteTableName inline)."
---

## Context

`AbstractAdapter._qi` / `_qt`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1195` and
the sibling `_qt`, plus a second `_qi` on the SchemaStatements mixin at
`connection-adapters/abstract/schema-statements.ts:332`) are trails-invented
abbreviations that just forward to `quoteColumnName` / `quoteTableName`.

Rails has no such shorthand: `abstract/schema_statements.rb` writes
`quote_column_name(...)` and `quote_table_name(...)` inline at every DDL site
(e.g. `remove_column` at `abstract/schema_statements.rb:686`, `rename_index`
at `:1049`). The abbreviation obscures which Rails quoter a DDL string is
reaching, which is exactly the confusion that produced the `quoteIdentifier`
divergence removed by #5893.

There are 30 `this._qi(` / `this._qt(` call sites across 2 files
(`abstract/schema-statements.ts`, `postgresql/schema-statements-class.ts`).
Both helpers are already `@internal`, so this is a pure inlining: delete the
two forwarders and spell the Rails method name at each site.

Discovered while converging `quoteIdentifier` into `quoteColumnName` (#5893):
`_qi` was the last indirection still reading as "quote identifier" after the
method it named was gone.

## Acceptance criteria

- `_qi` and `_qt` are deleted from `abstract-adapter.ts` and
  `abstract/schema-statements.ts`.
- All 30 call sites spell `this.quoteColumnName(...)` /
  `this.quoteTableName(...)`, matching the Rails line they mirror.
- No behaviour change: `_qi` already forwards to `quoteColumnName` and `_qt`
  to `quoteTableName`, so the emitted SQL is byte-identical.
- `pnpm typecheck`, `pnpm lint` clean; adapter/schema-statement suites pass.
