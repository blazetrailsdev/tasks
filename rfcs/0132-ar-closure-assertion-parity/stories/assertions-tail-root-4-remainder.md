---
title: "assertions-tail-root-4-remainder"
status: ready
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
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

Remainder of assertions-tail-root-4: `relation/update_all_test.rb › update all doesnt ignore order` still reports `rails 13 vs trails 3` (count) and `equal rails 9 vs trails 1, notEqual rails 2 vs trails 0` (kind).

Rails `vendor/rails/activerecord/test/cases/relation/update_all_test.rb:331-` defines `test_update_all_doesnt_ignore_order` and nests several `def test_...` methods (order-and-limit subset tests) INSIDE it, so the test-compare extractor attributes their assertions to this test. The trails body was converged to the visible Rails body (lambda, `assert_not`, `assert_queries_match`). What is left is either mirroring the nested assertions or teaching `scripts/test-compare` that nested defs are separate tests; cause of the extractor behaviour not verified beyond reading the Ruby.

## Acceptance criteria

- `update_all_test.rb › update all doesnt ignore order` reports 0 count/kind mismatches in `pnpm parity:test -- --package activerecord --assertions`.
- No test renames; mark file untouched.
