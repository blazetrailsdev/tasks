---
title: "converge-loader-query-eql-and-hash-onto-rails"
status: draft
updated: 2026-09-05
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LoaderQuery`'s value-protocol pair in
`packages/activerecord/src/associations/preloader/association.ts:334-372`
diverges from Rails
(`vendor/rails/activerecord/lib/active_record/associations/preloader/association.rb:17-26`)
in three ways. Surfaced while renaming `hashKey` → `hash` in PR #7516 (the
RFC 0130 receipt burndown), which is why the pair is now measured at all — see
the existing baseline row for `load_records_for_keys` in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/preloader/association.json`,
which records that nested classes were dropped from the population until
`compare-drops-nested-class-methods-from-coverage-denominator`.

1. **The `eql?` / `hash` table-name asymmetry is collapsed.** Rails' `eql?`
   compares `scope.table_name` (`:19`) while its `hash` uses
   `scope.model.table_name` (`:25`) — different receivers, deliberately. trails
   routes both through one `_scopeTableName()` helper (`:355-357`), which reads
   `scope?._model?.tableName ?? scope?.tableName`, so the two sides can no longer
   disagree the way Rails lets them.

2. **`_scopeAdapterId()` is invented surface.** Rails compares
   `scope.model.connection_specification_name` directly (`:20`, `:25`). trails
   (`:359-372`) keeps a static `LoaderQuery._adapterIds` registry keyed on the
   live connection object, with a `ConnectionNotDefined` fallback to the bare
   spec name. Nothing in Rails identifies a loader query by adapter identity.

3. **Rails inlines; trails extracts.** Rails writes both bodies as single
   expressions. trails adds three private helpers (`_scopeTableName`,
   `_scopeAdapterId`, `_valuesForQueries`) — CLAUDE.md's "If Rails inlines
   something, inline it."

`hash` returning a `::`-joined string where Ruby's returns the Integer from
`Array#hash` is NOT in scope: JS has no `Array#hash` and a `Map`/`groupBy` key
must be a primitive, so that one is a genuine language shortcoming and should
stay.

## Acceptance criteria

- `eql` compares `scope.tableName`, and `hash` composes `scope.model.tableName`,
  restoring Rails' asymmetry at `:19` vs `:25`.
- Both read `connectionSpecificationName` directly; `_scopeAdapterId()` and the
  `LoaderQuery._adapterIds` registry are deleted. If the adapter-identity
  behaviour is load-bearing for a test, that test is cited here first.
- The three private helpers are inlined, matching Rails' one-expression bodies.
- `pnpm parity:api:calls` shows no new rows, and the `load_records_for_keys` row
  in the exclude shard is revisited while the file is open.
- The preloader suites stay green on all three adapter lanes.
