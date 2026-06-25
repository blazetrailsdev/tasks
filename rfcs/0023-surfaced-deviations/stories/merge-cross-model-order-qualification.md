---
title: "merge-cross-model-order-qualification"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

When `Relation#merge` folds in a relation from a _different_ model, that other
relation's order columns must be qualified against **its** table, mirroring
how `Merger#mergeSelectValues`
(packages/activerecord/src/relation/merger.ts) already routes cross-model
select columns through `arelColumns`. Rails resolves `order(:name)` to
`authors.name` at build time on the origin relation, so the merged query orders
by `authors.name`. trails stores order values raw and qualifies them late
against the **receiver**, so `Post...merge(Author.order("name"))` emits
`posts.name` → `no such column: posts.name`.

Surfaced by the faithful port of `relation/merging_test.rb`
(MergingDifferentRelationsTest "merging order relations" and
"merging order relations (using a hash argument)"), currently `it.skip` in
packages/activerecord/src/relation/merging.test.ts with this story slug.

Rails ref: `Merger#merge_multi_values`
(vendor/rails/activerecord/lib/active_record/relation/merger.rb).

## Acceptance criteria

- [ ] `Merger#mergeMultiValues` qualifies the other relation's order columns
      against the other model's table when `other._modelClass !== rel._modelClass`.
- [ ] Un-skip both "merging order relations" tests; they pass.
- [ ] No regression in existing order/merge tests.
