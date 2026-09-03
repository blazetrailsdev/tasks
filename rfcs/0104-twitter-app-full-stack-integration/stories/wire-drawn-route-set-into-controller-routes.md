---
title: "wire-drawn-route-set-into-controller-routes"
status: done
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: 7439
claim: "2026-09-03T11:34:47Z"
assignee: "port-trails-autoloaders"
blocked-by: null
closed-reason: null
---

## Context

`port-view-context-class-on-controller` ported
`ActionView::Rendering::ClassMethods#build_view_context_class`
(`actionview/lib/action_view/rendering.rb:59-73`), whose `routes` arm is

```ruby
if routes
  include routes.url_helpers(supports_path)
  include routes.mounted_helpers
end
```

`routes` there is the controller's `_routes`. Nothing in trails ever assigns it:
`ActionController::Base._routes` (`packages/actionpack/src/action-controller/base.ts`)
is the `null` of `_routesClassDefault`
(`packages/actionpack/src/abstract-controller/url-for.ts`), and a grep of
`packages/trailties/src` finds no assignment. So a booted app's templates still
cannot reach `postsPath` as a bare identifier even though the view class would
carry it the moment `_routes` were set — the arm is proven only by
`packages/actionview/src/rendering.test.ts`, which hand-sets `_routes`.

Rails wires it from the route set: `RouteSet#include_helpers`
(`actionpack/lib/action_dispatch/routing/route_set.rb`) and
`AbstractController::Railties::RoutesHelpers.with(routes)`
(`actionpack/lib/abstract_controller/railties/routes_helpers.rb`), reached from
`ActionController::Railtie`'s `set_routes_url_helpers`-shaped initializer and
`Engine`'s `:add_routing_paths` neighbours. trails has the factory ported
(`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`,
`withRoutesHelpers`) but no caller: nothing invokes it, and it mixes helpers
onto the controller's prototype rather than setting `_routes`.

`port-engine-railtie-routes-url-helpers` (RFC 0072) covered the
`railtie_routes_url_helpers` half and was closed out-of-scope for that RFC's
data-layer remit.

## Acceptance criteria

- A booted application assigns its drawn `RouteSet` to the controller's
  `_routes`, at Rails' wiring site and under Rails' name.
- `withRoutesHelpers` either gains its Rails caller or is folded into that
  wiring — it does not stay callerless.
- An integration test in `packages/trailties/src/application.test.ts` renders a
  boot-app template that calls a named route helper as a bare identifier and
  asserts the generated path.
