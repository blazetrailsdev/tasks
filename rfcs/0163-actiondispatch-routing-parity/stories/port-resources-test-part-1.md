---
title: "Port controller/resources_test.rb lines 1-600 under the Rails test names"
status: draft
updated: 2026-09-27
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "mapper-resources-hand-builds-canonical-routes",
    "mapper-resources-uses-activesupport-inflector",
    "port-actionpack-abstract-unit-test-support",
    "port-abstract-unit-routing-and-assertion-helpers",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/resources_test.rb` (1471 lines)
is one class, `ResourcesTest < ActionController::TestCase` (`:21`), with 78
`def test_*` tests. `pnpm parity:test --package actioncontroller` reports 0/78
matched and 78 extra: `packages/actionpack/src/action-controller/controller/resources.test.ts`
spells every name as the raw Ruby method (`it("test_irregular_id_with_no_constraints_should_raise_error")`,
`:118`), where `scripts/test-compare/extract-ruby-tests.rb:691` derives
`"irregular id with no constraints should raise error"`. The TS file is 460
lines against Rails' 1471, so the bodies are thinner than Rails' too.

Rails' tests lean on `assert_restful_routes_for` /
`assert_singleton_restful_routes_for` and friends (private helpers at the bottom
of the file) and on `ResourcesController` from `test/abstract_unit.rb:351-358`.

This story takes the 35 tests in Rails lines 1-600 (16 in 1-249, 12 in 250-499,
7 in 500-600).

## Acceptance criteria

- Each test carries the extractor's name and Rails' body, including the
  private assertion helpers ported at their Rails names.
- Re-spelling is convergence, not a rename (RFC 0139's
  `journey-test-names-to-rails-def-test-form` precedent).
