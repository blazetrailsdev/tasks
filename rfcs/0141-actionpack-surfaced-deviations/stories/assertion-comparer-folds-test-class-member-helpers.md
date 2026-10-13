---
title: "Assertion comparer folds helpers called through the test-class instance"
status: draft
updated: 2026-10-13
rfc: "0141-actionpack-surfaced-deviations"
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

Rails test classes define helper instance methods that tests call bare:
`LegacyRouteSetTests#test_named_routes_array` calls `test_named_route_method`
(`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:826-842`), and
`setup_for_named_route` (`:506-508`) is called the same way. The faithful port
puts such a method on the test class, as
`packages/actionpack/src/action-controller/controller/routing.test.ts` already
does for `setupForNamedRoute` and `setupRequestMethodRoutesFor`, and calls it
through the instance: `tc.testNamedRouteMethod()`.

The assertion comparer in `scripts/test-compare/` folds a helper's assertions
into its caller only for a bare call to a same-file function. With the helper
as a class member called `tc.testNamedRouteMethod()`, `named route method` read
as 0 assertions against Rails' 2 and `named routes array` as 1 against 3, and
the `actioncontroller` assertion-count mark went 92 -> 94 (trails#8859, CI run
38412111547). The PR shipped a describe-local `const testNamedRouteMethod`
called bare instead, which is a shape Rails does not have.

## Acceptance criteria

- The TS assertion extractor folds the assertions of a method defined on a
  same-file test class into a test that calls it through an instance of that
  class (`tc.helper()`), as it does for a bare same-file call.
- `testNamedRouteMethod` in `controller/routing.test.ts` becomes a member of
  `LegacyRouteSetTests` called as `tc.testNamedRouteMethod()`, with
  `pnpm parity:test:assertions` still OK.
