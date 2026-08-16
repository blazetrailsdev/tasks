---
title: "Retire relation.ts's bespoke SQL compile layer for connection.toSql"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["converge-relation-build-arel-single-builder"]
deps-rfc: []
est-loc: 400
priority: null
pr: 6604
claim: "2026-08-16T18:32:19Z"
assignee: "burn-down-in-closure-inflections-and-descendants-tracker"
blocked-by: null
closed-reason: null
---

## Context

Follow-on to the `build_arel` convergence story. Rails renders a relation's SQL
with `model.with_connection { |c| c.unprepared_statement { c.to_sql(arel) } }`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1217-1218`) — the
connection owns collector selection, bind numbering and quoting.

`relation.ts` carries a parallel compile layer with no Rails counterpart:

- `_compileSelectSql` (`relation.ts:5465`)
- `_compileAstWithBinds` (`:5535`)
- `_typeCastBinds` (`:5546`)
- `_applyBindLimitFallback` (`:5496`)
- `_arelVisitor` (`:5429`)
- `_selectVisitor` (`:5438`)
- `_toSqlViaConnection` (`:5016`)
- `_conn` (`:5394`), `_resolveAdapter` (`:5399`), `_quoteBareColumn` (`:5632`),
  `_isKnownColumn` (`:5606`), `_qualifiedCol` (`:5651`),
  `_annotationComments` (`:5415`)

`_toSqlViaConnection`'s own JSDoc already concedes the prepared-statements
toggle is a no-op ("It is a no-op for the current output: `connection.toSql`
already inlines every bind through a SubstituteBinds collector
unconditionally"), which is evidence the layer has outlived whatever it was
for.

Depends on the `build_arel` story: while two builders exist, the compile layer
has two shapes to serve.

## Acceptance criteria

- `toSql()` (`relation.ts:4984`) and `_toSql()` (`:5039`) collapse into the one
  Rails method `to_sql` (`relation.rb:1210`), rendering through
  `connection.toSql(arel)` inside `withConnection` + `unpreparedStatement`.
- The invented compile helpers listed above are deleted; anything genuinely
  needed moves into the adapter/`arel` visitor where Rails puts it.
- SQL output unchanged across all three adapters — the `relation/*.test.ts`
  suites and `relation/arel-ast-convergence.test.ts` pass unchanged.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
