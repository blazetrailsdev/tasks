---
title: "assertions-has-many-associations-remainder"
status: draft
updated: 2026-09-18
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

Remainder of `assertions-has-many-associations` after trails#7864 converged ~35 of 311 tests in
`packages/activerecord/src/associations/has-many-associations.test.ts` against
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.
After #7864: 97 assertion-count and 167 assertion-kind mismatches remain
(`pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`).
Remaining tests still use placeholder Author/Post classes instead of the Rails scenario
(counter-cache cluster ~test_has_many_without_counter_cache_option onward, clearing/deleting/destroying,
dependence/restrict, get/set ids, replace, extend option, in-memory replacement, composite key).
Fixture-dependent tests need their own nested `describe` with `fixtures([...])`, since a non-empty
`fixtures()` on the shared describe trips blazetrails/test-fixture-parity for every test.
Known blocker: `association proxy transaction method starts transaction in association class`
(has_many_associations_test.rb:2506) — vi.spyOn(Comment, "transaction") records 0 calls inside this file only.

## Acceptance criteria

- has_many_associations_test.rb reports 0 assertion-count/kind/value mismatches.
- No test renames; mark file untouched.
