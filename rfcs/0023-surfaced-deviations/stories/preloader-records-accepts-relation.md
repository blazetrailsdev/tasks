---
title: "Preloader: support Relation as records argument (materialize + preload in 2 queries)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-21T21:18:42Z"
assignee: "preloader-records-accepts-relation"
blocked-by: null
---

## Context

Rails `Preloader.new(records: relation, associations: ...)` accepts an `ActiveRecord::Relation` as `records` and materializes it with a first query before loading associations (total: 2 queries for `assert_queries_count(2)` in `test_preload_makes_correct_number_of_queries_on_relation`, `associations_test.rb:827`).

Trails `Preloader` only accepts `Base[]` (the `records` option is typed as an array of model instances). Passing a Relation is not supported.

The wave-1 canonical conversion (PR #3603) works around this by using `Post.where({id}).includes("comments").toArray()` which produces the same 2-query observable via the `includes()` path, but does not exercise the `Preloader`-receives-`Relation` code path.

## Acceptance criteria

- `Preloader` accepts `Relation` as `records` (materializes it before loading associations)
- `test_preload_makes_correct_number_of_queries_on_relation` passes a `Relation` directly to `Preloader` as in Rails
- `test:compare` delta non-negative
