---
title: "Base.predicateBuilder is Table-backed, not TableMetadata-backed like Rails"
status: in-progress
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4846
claim: "2026-07-13T19:38:23Z"
assignee: "predicate-builder-base-not-tablemetadata-backed"
blocked-by: null
---

## Context

Rails' `Topic.predicate_builder` (and every `Model.predicate_builder`) is
always backed by a `TableMetadata` instance, so dot-notation /
schema-qualified keys and association-key expansion flow through
`associated_table` fallback automatically. In trails, `Base.predicateBuilder`
(`core.ts` `predicateBuilder()`) is constructed from a bare Arel `Table`
(`new PredicateBuilder(this.arelTable)`), NOT a `TableMetadata`.

Surfaced while converging
`packages/activerecord/src/relation/predicate-builder.test.ts` (PR #4158): the
`build from hash with schema` test had to construct
`new TableMetadata(Topic, Topic.arelTable).predicateBuilder` by hand to get the
Rails-faithful `"schema.table"."column"` expansion, because
`Topic.predicateBuilder.buildFromHash({...})` uses the Table-backed builder and
does not do the associated_table fallback.

- trails: `packages/activerecord/src/core.ts` `predicateBuilder()`
- Rails: `activerecord/lib/active_record/core.rb` `predicate_builder` /
  `table_metadata`

## Acceptance criteria

- [ ] `Base.predicateBuilder` is backed by a `TableMetadata` for the model's
      table, matching Rails.
- [ ] `Model.predicateBuilder.buildFromHash({"schema.table.column": "value"})`
      expands to `"schema.table"."column" = ?` without a hand-built
      `TableMetadata`.
- [ ] The predicate-builder.test.ts `build from hash with schema` test is
      updated to call `Topic.predicateBuilder.buildFromHash(...)` directly.
