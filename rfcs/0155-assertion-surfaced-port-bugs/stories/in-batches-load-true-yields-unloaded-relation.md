---
title: "in-batches-load-true-yields-unloaded-relation"
status: draft
updated: 2026-09-18
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

`Post.inBatches({ of: 1, load: true })` yields relations whose `isLoaded` is false. Rails
`vendor/rails/activerecord/test/cases/batches_test.rb:452-456` (`test_in_batches_should_be_loaded`)
asserts `assert_predicate relation, :loaded?` for each yielded relation
(`relation/batches.rb` `in_batches` builds `yielded_relation` and calls `load` when `load: true`).
Parked as `it.skip` in `packages/activerecord/src/batches.test.ts` with converged body
(`expect(relation.isLoaded).toBeTruthy()`). Cause not investigated; see `relation/batches.ts` inBatches.

## Acceptance criteria

- The parked test is un-skipped and passes; yielded relation is loaded when `load: true`.
