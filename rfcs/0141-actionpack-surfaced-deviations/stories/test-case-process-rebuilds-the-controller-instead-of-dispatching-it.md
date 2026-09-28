---
title: "ActionController::TestCase#process rebuilds the controller instead of dispatching @controller"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

Rails' `ActionController::TestCase::Behavior#process`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:512-552`) dispatches the
`@controller` the test already holds: `@controller.clear_instance_variables_between_requests`
(`:514`), `@controller.recycle!` (`:529`, `:637`), then
`wrap_execution { @controller.dispatch(action, @request, @response) }` (`:639`). That
`@controller` is built once, in the `setup :setup_controller_request_and_response` callback
(`:564-590`, registered at `:598`), or assigned by the test itself.

trails' `process` (`packages/actionpack/src/action-controller/test-case.ts:340`) does
`this.controller = new this._controllerClass()` on every call. So anything done to the
test's controller before a request is discarded. In particular
`RoutingAssertions#create_routes`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/routing.rb:274-293`)
clones `@controller`, includes the temporary route set's `url_helpers` in the clone's
singleton class and extends its `view_context_class`. The trails port
(`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`, `createRoutes`)
does the same, but the next `get` inside `withRouting` replaces the clone, so the
temporary helpers never reach the controller that handles the request. With no setup
callback, a class-level `withRouting` also sees no controller at all.

Related: `test-case-missing-methods-and-arity` ports
`setup_controller_request_and_response`; `test-case-process-rebuilds-the-request-instead-of-reusing-it`
covers the request half of the same `process` divergence.

## Converged shape

`process` dispatches `this.controller` as Rails does (`:514`, `:529`, `:637-642`) and
never constructs one. The controller comes from `setupControllerRequestAndResponse`,
run as a `setup` callback on `ActionController::TestCase`, or from a test's own
assignment.

## Acceptance criteria

- `test-case.ts`'s `process` contains no `new this._controllerClass()`; it calls
  `clearInstanceVariablesBetweenRequests`, `recycleBang` and `dispatch` on `this.controller`.
- Inside `withRouting` on a controller test, the controller that handles `get` answers the
  temporary route set's `*_path` helpers (a test drawing a named route and rendering its
  helper from the action).
- `pnpm parity:api:calls` stays green; any row this converges is deleted by hand.
