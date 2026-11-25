---
title: "safe-constantize-returns-null"
status: draft
updated: 2026-11-25
rfc: "0259-near-complete-packages-to-100"
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

`safe_constantize` (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/inflector/methods.rb:315-324`)
returns `nil` from its `NameError` and `LoadError` rescue arms. trails' `safeConstantize`
(`packages/activesupport/lib/inflector.ts`) returns `undefined` on both, so ports of
`assert_nil` (`inflector_test.rb:475`, and the `run_safe_constantize_tests_on` cases in
`constantize_test_cases.rb`) assert `toBeUndefined()`. Raised on trails#10740 review.

## Acceptance criteria

- [ ] Both rescue arms return `null`, and the declared return type says so.
- [ ] Tests asserting a `safeConstantize` miss use `toBeNull()`.
- [ ] Callers that test the result against `undefined` are updated.
