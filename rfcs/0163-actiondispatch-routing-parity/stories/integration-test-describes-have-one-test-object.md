---
title: "A describe porting an ActionDispatch::IntegrationTest subclass has one test object"
status: ready
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
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

`TestRoutingMapper` in
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` is
`class TestRoutingMapper < ActionDispatch::IntegrationTest` in Rails
(`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:8`), so the test
object IS the integration test. The port builds
`t = new IntegrationTest(task.name)` in a `beforeEach`, beside the
`ActiveSupport::TestCase` instance
`packages/activesupport/src/testing/autorun.ts` builds for the same vitest
test. Other actionpack test files do the same (`TestConstraintsDefaults` in the
same file, `dispatch/routing/instrumentation.test.ts`).

trails#8868 removed this shape for activerecord: `fixtures()` registers the
describe's class in `describedClasses` (`autorun.ts`) and autorun instantiates
it. `describe("TestRoutingMapper")` has no constant of that name for autorun's
`safeConstantize(suite.name)` to find.

## Acceptance criteria

- [ ] A describe that ports an `ActionDispatch::IntegrationTest` subclass has
      one test object: autorun instantiates the subclass and the test reaches
      it through the vitest context.
- [ ] `routing.test.ts` builds no `IntegrationTest` of its own.
