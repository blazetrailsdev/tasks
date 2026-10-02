---
title: "RoutingAssertions#setup does not call super: trails has no Minitest::Test#setup and the lifecycle never sends instance setup"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8406 (`action-dispatch-assertions-is-not-an-includable-module`).

Rails' `RoutingAssertions#setup`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/routing.rb:107-110`)
is `@routes ||= nil; super`. The `super` reaches `Minitest::Test#setup`
(`vendor/minitest/v5.27.0/lib/minitest/test.rb:154`), and Minitest's run loop
sends `before_setup`, `setup`, `after_setup` in turn
(`test.rb:21` `SETUP_METHODS`, `:91`).

trails' `setup` (`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`)
is `if (this.routes == null) this.routes = undefined;` and stops:

- there is no `super` call, because nothing above `RoutingAssertions` in the
  ancestry defines an instance `setup` (`ActiveSupport::TestCase` in
  `packages/activesupport/src/test-case.ts` has only the class-level `static
setup` callback registrar and `beforeSetup` / `afterTeardown`);
- the lifecycle in `packages/activesupport/src/testing/autorun.ts` awaits
  `testCase.beforeSetup()` and never calls instance `setup` or `afterSetup`, so
  the method is dead code today. A subclass that defines `setup()` (as
  `controller/test-case.test.ts`'s test classes do) is not run through it either.

`RoutingAssertions` is a live `Module` now, so `RoutingAssertions.superMethod(this, "setup")`
is available once there is a method to resume at.

## Converged shape

- `Minitest::Test#setup` and `#after_setup` exist as empty instance methods at the
  class trails ports `Minitest::Test` onto (`test.rb:148-162`).
- The run loop sends `before_setup`, `setup`, `after_setup` in order, as
  `test.rb:91` does.
- `RoutingAssertions#setup` is `@routes ||= nil` followed by
  `RoutingAssertions.superMethod(this, "setup")!()`.

## Acceptance criteria

- `setup` in `testing/assertions/routing.ts` calls `super` and carries no
  call-mismatch baseline row for it.
- A test asserts that an `ActionController::TestCase` subclass's instance `setup`
  runs between `beforeSetup` and the test body, and that `routes` is `null`/unset
  rather than undefined-by-accident before it.
- `packages/actionpack/src/action-controller/controller/test-case.test.ts` and
  `packages/trailties/src/boot-app-test-help.trails.test.ts` stay green.
