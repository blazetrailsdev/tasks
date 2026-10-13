---
title: "TestRoutingMapper's hand-written tests become the Rails bodies; StubController seating is deleted"
status: draft
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` matches
`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` by name, but the
`TestRoutingMapper` tests that predate trails#8868 are hand-written, not the
Rails bodies. They build `new RouteSet()` and assert on `routes.recognizePath`
and `routes.pathFor` where Rails' test (`routing_test.rb:8`,
`class TestRoutingMapper < ActionDispatch::IntegrationTest`) draws through
`draw` (`:3938-3944`), issues `get "/path"` and asserts on `@response.body`
and the URL helpers. `logout`, `login`, `session singleton resource` and the
fourteen redirect tests are examples; the redirect ones call the module-level
`redirectResponse(routes, url)` where Rails calls `verify_redirect`
(`:3966-3970`).

Two pieces of scaffolding exist only for those tests:

- The file-level `beforeEach` seats a bare `StubController` under about ninety
  controller names in `controllerConstants`. Rails seats none: `draw` goes
  through `stub_controllers` (`actionpack/test/abstract_unit.rb:161-163`), whose
  `DeadEndRoutes` answers every controller. With a constant seated,
  `binary_params_for?` (`actionpack/lib/action_dispatch/http/parameters.rb`)
  finds a class where Rails rescues `MissingController`, so `StubController`
  had to gain a static `actionEncodingTemplate` in trails#8868.
- `redirectResponse` and `routeSpec`, which no Rails helper corresponds to.

The describe already has the Rails harness from trails#8868: `draw`, a
`t: IntegrationTest`, `assertResponse` and `verifyRedirect`.

## Acceptance criteria

- [ ] Each name-matched `TestRoutingMapper` test that is not the Rails body is
      replaced by it, through the describe's `draw` and `t`.
- [ ] The `controllerConstants` `beforeEach`, `StubController`,
      `redirectResponse` and any helper left without a caller are deleted.
- [ ] A test with no Rails counterpart moves to a `.trails.test.ts` sibling.
