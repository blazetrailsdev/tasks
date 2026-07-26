---
title: "Delegate joinTableName to deriveJoinTableName (blocked on module-init leaf constraint)"
status: draft
updated: 2026-07-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Migration::JoinTable#join_table_name` delegates to
`ModelSchema.derive_join_table_name(table_1, table_2)`
(`vendor/rails/activerecord/lib/active_record/migration/join_table.rb:12`,
`model_schema.rb:196-198`). PR #5331 put the real algorithm in
`packages/activerecord/src/model-schema.ts#deriveJoinTableName` and wired the
delegation — and had to revert it.

`packages/activerecord/src/migration/join-table.ts` has **zero imports**. Adding
the `model-schema.js` edge pulls that module's whole transitive graph in wherever
join-table is first imported (e.g. via `schema-statements.ts`), reordering
initialization enough that `base.ts:4802`'s top-level
`extend(Base, { belongsTo: _Associations.belongsTo })` reads an uninitialized
binding: `TypeError: Cannot read properties of undefined (reading 'belongsTo')`.
Caught only by `scripts/test-deps/adapter-graph-import-tdz.test.ts` (Unit Tests
job) — typecheck, lint and every AR suite pass while it is broken.

`joinTableName` therefore inlines the identical three lines, documented at the
call site, with a reasoned entry in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/migration/join-table.json`.

## Acceptance criteria

- `joinTableName` delegates to `deriveJoinTableName`, or the duplication is
  ratified with a written decision that the import-order constraint is permanent.
- `scripts/test-deps/adapter-graph-import-tdz.test.ts` passes.
- The `join_table_name -> derive_join_table_name` wide-exclude entry is removed
  if the delegation lands.
