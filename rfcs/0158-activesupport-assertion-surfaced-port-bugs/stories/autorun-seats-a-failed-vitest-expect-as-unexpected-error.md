---
title: "autorun seats a failed vitest expect as UnexpectedError; Minitest keeps a failed assertion as an Assertion"
status: draft
updated: 2026-10-02
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
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

`Minitest::Test#capture_exceptions` (`vendor/minitest/v5.27.0/lib/minitest/test.rb:190-198`) puts a
raised `Minitest::Assertion` onto `failures` as itself and wraps anything else in
`UnexpectedError`, so `error?` (`vendor/minitest/v5.27.0/lib/minitest.rb:639-641`) is false for a
failed assertion.

trails PR 8408 ported those two arms into `packages/activesupport/src/testing/autorun.ts`, keyed
on `e instanceof Assertion`. That holds for trails' own `assert*` helpers
(`packages/activesupport/src/testing/assertions.ts`), which throw `Assertion`. It does not hold
for vitest's `expect`, which throws chai's `AssertionError`: a failed `expect` is still seated as an
`UnexpectedError`, so `testCase.isError()` answers true where Minitest answers false. `expect` is
the assertion most trails tests use, and autorun already counts its calls as assertions
(`expect.getState().assertionCalls`).

Two more arms still seat vitest's serialized copy rather than the raised object, because the raise
never passes through the wrapped body: an `expect.soft` failure, and a raise in a `beforeEach`
hook. Minitest wraps `before_setup` / `setup` / `after_setup` in the same `capture_exceptions` as
the body (`test.rb:88-108`).

Open question for the port: `failures` is `Assertion[]`, and a chai `AssertionError` is not an
`Assertion`. Either the runner seats a chai failure as an `Assertion` carrying the original's
message and stack, or `Assertion` is made the class chai failures are recognised as.

## Acceptance criteria

- [ ] After a test body fails a vitest `expect`, `testCase.isError()` is false and `testCase.failures[0]` is an `Assertion` that is not an `UnexpectedError`.
- [ ] A raise in a `beforeEach` hook is captured as the raised object, with the same two arms.
- [ ] Covered in `packages/activesupport/src/testing/autorun.trails.test.ts`.
