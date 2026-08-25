---
title: "base-prevent-writes-drops-query-count-assertions"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5744
claim: "2026-07-31T19:33:09Z"
assignee: "base-prevent-writes-drops-query-count-assertions"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/base-prevent-writes.test.ts` drops two query-count
assertions that Rails makes in
`vendor/rails/activerecord/test/cases/base_prevent_writes_test.rb`:

- `:60-65` — "an empty transaction does not raise if preventing writes" wraps
  the `Bird.transaction { ... materialize_transactions }` block in
  `assert_queries_count(2, include_schema: true)`.
- `:54` — "an explain query does not raise if preventing writes" wraps the
  `explain.inspect` call in `assert_queries_count(2)`.

Both trails tests just run the block and assert nothing about how many queries
it issued, so a regression in transaction materialization or explain would not
be caught.

The file also lacks Rails' `if !in_memory_db?` class-level guard
(`base_prevent_writes_test.rb:6`).

Surfaced in review of #5740, which fixed the empty-transaction block body
(it was empty; it now makes the `materialize_transactions` call Rails makes)
but left the surrounding assertion out of scope.

## Acceptance criteria

- Both tests assert the Rails query counts, using the trails
  `assertQueriesCount` helper with the same `includeSchema` semantics.
- The `in_memory_db?` guard is ported or a note records why it does not apply.
- All eight tests still pass on sqlite, postgresql and mysql2.
