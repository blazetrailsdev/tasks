---
title: "Port the nine TestRoutingMapper stubs left in routing_test.rb lines 31-1999"
status: draft
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

`port-routing-test-mapper-skips-part-1` (trails PR for that story) replaced 18
of the `TestRoutingMapper` stubs in Rails lines 31-1999 with the Rails bodies,
in `packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`. The
describe now has the harness Rails' class has
(`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:3938-3970`): a
`draw` that goes through `IntegrationTest.stubControllers` and seats a
`RoutedRackApp`, and a `t: IntegrationTest` whose `method_missing` Proxy
answers the `_path` / `_url` helpers.

Nine stubs in that line range were left for size:

- `test_admin` (`:430-460`), which needs `IpRestrictor` (`:13-17`)
- `test_projects_involvements` (`:641-669`)
- `test_projects_posts` (`:826-870`)
- `test_path_option_override` (`:1032-1049`)
- `test_optional_scoped_root_multiple_choice` (`:1431-1476`)
- `test_redirect_with_complete_url_and_status` (`:1719-1726`) and
  `test_redirect_with_port` (`:1728-1739`), which need Rails' `verify_redirect`
  (`:3966-3970`). The file already has a module-level `verifyRedirect(routes, url)`
  with a different signature, used by the older hand-written redirect tests;
  those tests are converged onto the Rails helper in the same change.
- `test_nested_optional_scoped_path` (`:1803-1828`)
- `test_default_string_params_with_root` (`:1911-1918`)

Two things found while porting:

- `RouteOptions` (`routing/mapper.ts`) rejects an arbitrary default key, so
  `match "/", to: "pages#show", via: :get, id: "home"` (`:1895`) needs an
  `as RouteOptions` cast in the test. Rails takes any key as a default.
- The file-level `beforeEach` seats a bare `StubController` under ~90
  controller names, which Rails does not do; with it seated,
  `binary_params_for?` (`action_dispatch/http/parameters.rb`) finds a class
  where Rails rescues `MissingController`.

## Acceptance criteria

- [ ] Each of the nine stubs is replaced by the Rails body through the
      describe's `draw` and `t`.
- [ ] `RouteOptions` admits a default key without a cast, and the two casts in
      `routing.test.ts` are deleted.
- [ ] A test that exposes a mapper bug stays `it.skip` only with the id of a
      filed story.
