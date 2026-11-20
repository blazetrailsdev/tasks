---
title: "RoutingAssertions method_missing trap recurses through the controller reader on an unset @_controller"
status: draft
updated: 2026-11-20
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`spliceMethodMissing` (`packages/actionpack/lib/action-dispatch/testing/assertions/routing.ts:291-306`) answers a missed read by evaluating `receiver.controller`. `controller` is an `attr_internal` reader (`packages/activesupport/lib/module-ext.ts:193-201`) that reads `this["@_controller"]`. When that storage key is unset, its read misses and reaches the same trap, which reads `receiver.controller` again, giving `RangeError: Maximum call stack size exceeded`.

It reproduces when an `ActionView::TestCase` subclass is built with `Isolation` and its `methodMissing("rootPath")` is called (`railties/test/application/action_view_test_integration_case_test.rb:33`). It also reproduces with `new IntegrationTest(name).app()` inside a generated app (`railties/test/application/integration_test_case_test.rb:62-75`).

Rails' `RoutingAssertions#method_missing` (`actionpack/lib/action_dispatch/testing/assertions/routing.rb:286-296`) checks `@controller` (an ivar read, which never dispatches) before `@routes.named_routes.route_defined?`. The converged trap reads the storage key directly instead of going through the reader, so the miss cannot re-enter.

## Acceptance criteria

- [ ] The trap reads `@_controller` storage without re-entering itself.
- [ ] A regression test fails on the current code: a TestCase with unset `@_controller` reads an undefined name and gets `undefined`, not a RangeError.
