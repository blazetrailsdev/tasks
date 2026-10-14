---
title: "Port the 35 tests StaticEncodingTest inherits from StaticTest"
status: draft
updated: 2026-10-14
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps:
  - port-static-test-remainder-and-public-fixtures
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test-compare-credits-tests-inherited-from-a-same-file-superclass` made the
Ruby extractor replay a same-file test superclass's tests under each subclass,
as Minitest runs them. `class StaticEncodingTest < StaticTest`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/static_test.rb:357-361`)
overrides only `public_path` to `"公共"` and inherits all 35 of `StaticTest`'s
tests, so `pnpm parity:test --package actiondispatch` now counts
`dispatch/static_test.rb` as 70 tests and reports the 35 as missing.

`port-static-test-remainder-and-public-fixtures` ports `StaticTest`'s own
remainder over the `public/` and `公共/` fixtures. This story is the second
run of those tests.

## Acceptance criteria

- [ ] `describe("StaticEncodingTest")` in
      `packages/actionpack/src/action-dispatch/dispatch/static.test.ts` carries
      `StaticTest`'s 35 tests over the `公共` root.
- [ ] `pnpm parity:test --package actiondispatch` reports
      `dispatch/static_test.rb` 70/70.
