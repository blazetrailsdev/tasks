---
title: "Move Minitest::Mock, Object#stub and assert_mock into @blazetrails/minitest"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: minitest-package
packages: [minitest, activesupport]
deps: [minitest-package-ports-assertions-rb]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activesupport/src/testing/method-call-assertions.ts` mirrors Rails'
`MethodCallAssertions`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/method_call_assertions.rb:9-64`),
but also holds Minitest's `Mock` and `MockExpectationError`
(`vendor/minitest/v5.27.0/lib/minitest/mock.rb:10`), `Object#stub` (`:286`) and
`assert_mock` (`:241`), at `method-call-assertions.ts:5-90,248-325`.
`parity:api:extra --package activesupport` scores one moved name there. Test
code calls `stub` in 11 files and `assertMock` in 3, and keeps doing so: they
are Minitest API with no Vitest twin (RFC Non-goals).

## Acceptance criteria

- [ ] `Mock`, `MockExpectationError`, `stub` and `assertMock` live in
      `@blazetrails/minitest` at the file mirroring `lib/minitest/mock.rb`.
- [ ] `method-call-assertions.ts` holds only the Rails module's members and
      imports `Mock` / `assertMock` from the new package, keeping every call
      its Ruby body makes.
- [ ] Test callers of `stub` / `assertMock` import from `@blazetrails/minitest`.
- [ ] `parity:api*` gates green.
