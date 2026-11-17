---
title: "Under autorun a vitest test cannot be an ActionController::TestCase, so apps build an inner one whose fixture transaction nests unclosed"
status: draft
updated: 2026-11-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack", "activesupport"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap#155. `@blazetrails/activesupport/testing/autorun`
(`lib/testing/autorun.ts`, the `beforeEach` that builds `context.testCase`
from `specType(describe(...))`) turns every vitest `it` into an
`ActiveSupport::TestCase`, and test-help includes `TestFixtures` into it, so
each test holds a fixture transaction. Nothing maps a `describe` to
`ActionController::TestCase`: actionpack never calls `registerSpecType`.

So an application testing a controller from a vitest `it` builds a second
`ActionController::TestCase` inside the running one and calls `beforeSetup`
itself (trailmap's `test/support/controller-test-case.ts`). That inner case is
also an `ActiveSupport::TestCase`, opens its own fixture transaction, and is
never torn down, so the outer teardown rolls back only one level and rows
leak between tests. trailmap#155 had to set `useTransactionalTests = false`
on the inner case to stop `mutations-controller.test.ts` leaking.

## Acceptance criteria

- A vitest suite can run its tests as `ActionController::TestCase` instances
  under autorun (a spec type keyed on the described controller, or an
  explicit opt-in), with `get`/`post`/`response` on the test case autorun
  builds and one fixture transaction per test.
- A test in actionpack covers it: rows written in one test are gone in the
  next.
- trailmap's `controllerTestCase` stops building an inner case.
