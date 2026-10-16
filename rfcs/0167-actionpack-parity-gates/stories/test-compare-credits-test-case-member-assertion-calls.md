---
title: "test-compare credits tc.assertX member calls as assertions; drop bare-call alias wrappers"
status: ready
updated: 2026-10-16
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
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

Rails test helpers are private methods on the test class, called bare:
`assert_recognizes`, `assert_restful_routes_for`, `with_restful_routing`
(`vendor/rails/v8.0.2/actionpack/test/controller/resources_test.rb:1178-1470`).
trails ports them as methods on a `TestCase` subclass, and tests call them as
`tc.assertX(...)`. test-compare's TS extractor counts an assertion only for a
bare call, so `tc.assertX` counted 0 and the assertion-count ratchet went +33
on trails#8915.

The workaround is `describe`-local aliases
(`const assertRecognizes = (...args) => tc.assertRecognizes(...args)`):

- 14 in `packages/actionpack/src/action-controller/controller/resources.test.ts`
- the same shape in `action-controller/controller/test-case.test.ts`
  (`assertRouting`, `assertGenerates`)

Rails has no such layer.

## Acceptance criteria

- The test-compare TS extractor counts `<ident>.assertX(...)` / `refuteX` /
  `expectX` calls where `<ident>` is the test-case instance as assertions, the
  same as bare calls. This includes same-file helper folding.
- The alias wrappers in `resources.test.ts` and `test-case.test.ts` are removed,
  and their call sites use `tc.assertX(...)`.
- The assertion-mismatch ratchet stays green, with no mark change.
