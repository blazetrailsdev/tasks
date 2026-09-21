---
title: "Port the four unported abstract_mysql_adapter/optimizer_hints_test.rb tests"
status: ready
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/optimizer_hints_test.rb`
defines five tests; `packages/activerecord/src/adapters/abstract-mysql-adapter/optimizer-hints.test.ts`
ports only `test_optimizer_hints` (converged in trails#7919). Four remain unported:

- `test_optimizer_hints_with_count_subquery` (optimizer_hints_test.rb:18-24) — hint
  survives the `count` subquery; `assert_queries_match` + `assert_equal 5, posts.count`.
- `test_optimizer_hints_is_sanitized` (:27-38) — two `assert_queries_match` blocks; the
  second asserts the hint spelled with doubled asterisk-slash is neutered, and that `posts.first.as_json == { "id" => 1 }`.
- `test_optimizer_hints_with_unscope` (:41-47) — `unscope(:optimizer_hints)` drops the
  comment, asserted via `assert_queries_match(%r{\ASELECT \`posts\`\.\`id\`})`.
- `test_optimizer_hints_with_or` (:50-67) — `or` keeps the left relation's hint and drops
  the right's; three `capture_sql` blocks with `assert_equal 1, queries.length`,
  `assert_includes` and `assert_not_includes`.

`parity:test --package activerecord --assertions --missing` reports the file as
`1 matched / 4 missing` after trails#7919.

## Acceptance criteria

- All four tests ported under their Rails names into the existing
  `adapters/abstract-mysql-adapter/optimizer-hints.test.ts`, inside the existing
  `describeIfSupports("optimizer_hints", "OptimizerHintsTest", ...)`.
- Assertion kinds/counts match Rails (use `assertQueriesMatch` for
  `assert_queries_match`, `captureSql` for `capture_sql`).
- `parity:test` reports the file `✓` with 0 missing.
