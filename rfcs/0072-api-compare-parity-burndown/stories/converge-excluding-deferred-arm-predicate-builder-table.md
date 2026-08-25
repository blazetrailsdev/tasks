---
title: "Route excluding's deferred arm through the predicate builder's table"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5926
claim: "2026-08-02T22:46:52Z"
assignee: "converge-excluding-deferred-arm-predicate-builder-table"
blocked-by: null
closed-reason: null
---

## Context

Left alone by #5903 (`converge-relation-table-attr-reader-reads`). Rails'
`Relation#excluding` builds its predicate through
`predicate_builder[primary_key, records].invert`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`,
`excluding`), and `PredicateBuilder#[]` reads the attribute off the builder's
own arel table (`predicate_builder.rb:53-55`).

trails has two arms in `excluding`
(`packages/activerecord/src/relation/query-methods.ts`):

- the literal arm correctly uses `this.predicateBuilder.table.arelTable.get(pk)`
- the deferred (`DeferredIdsNotIn`) arm at ~line 1617 uses
  `(this._modelClass as any).arelTable.get(pk)`

So an aliased relation, or one whose predicate builder carries different table
metadata, resolves the deferred arm's attribute against the model's default
table. #5903 deliberately left this alone: it is a predicate-builder read, not
a `Relation#table` attr_reader read.

## Acceptance criteria

- The deferred arm reads the attribute off `predicateBuilder.table.arelTable`,
  matching the literal arm and Rails' `predicate_builder[...]`.
- Regression test that fails on baseline, exercising `excluding` with an
  unloaded relation argument on a relation whose predicate builder table
  differs from `model.arelTable`.
- `pnpm parity:api:calls` stays green; baseline does not grow.
