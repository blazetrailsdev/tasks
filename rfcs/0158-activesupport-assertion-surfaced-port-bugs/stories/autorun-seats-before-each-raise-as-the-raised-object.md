---
title: "autorun-seats-before-each-raise-as-the-raised-object"
status: draft
updated: 2026-11-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`Minitest::Test#run` wraps `before_setup` / `setup` / `after_setup` in the same
`capture_exceptions` as the body (`vendor/minitest/v5.27.0/lib/minitest/test.rb:88-108`),
so a raise in setup is seated as the raised object.

trails' `packages/activesupport/lib/testing/autorun.ts` captures the raised
object for its own SETUP_METHODS loop, but a raise in a user vitest
`beforeEach` hook and an `expect.soft` failure never pass through a wrapped
body: `afterEach` seats vitest's serialized copy from `task.result.errors`.
Since the autorun-seats-a-failed-vitest-expect-as-unexpected-error story, a
serialized chai `AssertionError` is seated as an `Assertion` (via
`Assertion[Symbol.hasInstance]`), but it is still the serialized copy, not the
raised object (`autorun.trails.test.ts`, "when a beforeEach hook raises").

## Acceptance criteria

- [ ] A raise in a vitest `beforeEach` hook is seated on `testCase.failures` as
      the raised object (`.error` is `===` the thrown error for a non-Assertion).
- [ ] Covered in `packages/activesupport/test/testing/autorun.trails.test.ts`.
