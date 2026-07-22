---
title: "reflection-column-helpers-duplicate-model-schema"
status: ready
updated: 2026-07-22
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
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

Surfaced while fixing `columns-reports-cast-type-not-column-type` (#5059).

`packages/activerecord/src/reflection.ts` exports a trio of column helpers —
`columns()`, `columnNames()`, `contentColumns()` — that have no counterpart in
Rails' `reflection.rb`; the real surface lives on ModelSchema
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:432-434` for
`columns`, `:444-446` for `column_names`, `:456-460` for `content_columns`)
and is already ported faithfully in
`packages/activerecord/src/model-schema.ts` (`columns` at
`model-schema.ts:698`, `columnNames` at `:224`, `contentColumns` at `:365`),
mixed onto Base (`base.ts:1566-1567`).

PR #5059 converged `reflection.columns()` to source from `columnsHash`, but:

- `reflection.columnNames()` (`reflection.ts:~2404`) still reads
  `_attributeDefinitions` — it includes virtual attributes and does not filter
  `ignoredColumns`, unlike Rails' `column_names` (= `columns_hash.keys`) and
  unlike its own sibling `columns()`.
- The trio duplicates the ModelSchema surface with a different return shape
  (`ColumnReflection {name, type, defaultValue}` vs real Column objects /
  string arrays), which is itself an invention.

Callers today: only `reflection.test.ts` (Rails-named `ReflectionTest` tests
that in Rails hit `Topic.columns` / `Topic.column_names` via ModelSchema) plus
the `index.ts` re-exports (`index.ts:314-317`).

## Acceptance criteria

- `reflection.columnNames()` converges to `columns_hash.keys` semantics (or
  the trio is retired outright in favor of the ModelSchema statics, updating
  `reflection.test.ts` to call `Topic.columns` etc. and adjusting the
  `index.ts` exports — pick whichever keeps the Rails-named tests asserting
  what Rails asserts).
- `reflection.test.ts` "columns are returned in the order they were declared"
  and "read attribute names" assert the canonical topics schema like Rails'
  `test_columns_are_returned_in_the_order_they_were_declared` /
  `test_read_attribute_names` (reflection_test.rb:51-65), not bespoke
  attribute declarations.
- No behavior change for `ModelSchema.columnNames` callers
  (`inheritance.ts:427,589` etc.).
