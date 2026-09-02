---
title: "build-a-dispatcher-per-route-with-raise-on-name-error"
status: done
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7368
claim: "2026-09-01T23:37:00Z"
assignee: "complete-set-routes-reloader-hook"
blocked-by: null
closed-reason: null
---

## Context

`Mapper::Mapping#app` builds a dispatcher **per route** and picks its
`raise_on_name_error` from whether that route pinned a controller
(`actionpack/lib/action_dispatch/routing/mapper.rb:294-303`):

```ruby
def app(blocks)
  if to.respond_to?(:action)
    Routing::RouteSet::StaticDispatcher.new to
  elsif to.respond_to?(:call)
    Constraints.new(to, blocks, Constraints::CALL)
  elsif blocks.any?
    Constraints.new(dispatcher(defaults.key?(:controller)), blocks, Constraints::SERVE)
  else
    dispatcher(defaults.key?(:controller))
  end
end
```

That flag is what `Dispatcher#serve`'s rescue reads (`route_set.rb:52-57`):
with it set, an unresolvable controller raises `ActionController::RoutingError`;
without it, the route cascades `[404, X-Cascade: pass, []]` so routing falls
through to the next match. `get "/posts", to: "posts#index"` pins `:controller`
and therefore raises; `get ":controller/:action"` does not and cascades.

trails builds a single `Dispatcher` for the whole set, hardcoded to `false`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts` —
`_routeDispatcher`), attached to every Journey route by
`buildJourneyRouter(this.routes, { app: this._routeDispatcher })`
(`routing/journey-bridge.ts:63-108`, whose `BuildJourneyRouterOptions.app`
takes one app for all routes). So a pinned-but-unregistered controller
cascades a 404 where Rails raises.

PR #7286 (`converge-routeset-setdispatcher-to-per-route-dispatcher`) routed
`RouteSet#call` through `Dispatcher` and deleted the whole-set
`setDispatcher` callback; before it, railties' `setup_main_autoloader` passed
`raiseOnNameError: true` explicitly, so the raising arm was reachable for the
application route set. It is not reachable now.

## Acceptance criteria

- Each Journey route carries its own `Dispatcher`, constructed with
  `raise_on_name_error` = "this route's defaults pin `:controller`", mirroring
  `mapper.rb:301`.
- `BuildJourneyRouterOptions` takes a per-route app rather than one shared
  `RoutableApp`, or the dispatcher is built where Rails builds it (the mapper).
- A route with `to: "posts#index"` whose controller constant is absent raises
  `ActionController::RoutingError` from `RouteSet#call`; a route matching a
  dynamic `:controller` segment still cascades `[404, X-Cascade: pass, []]`.
- The cascade tests in
  `packages/actionpack/src/action-dispatch/routing/dispatcher.test.ts` are
  re-pointed at the arm that still cascades, and the pinned-route ones assert
  the raise.

## Notes

`StaticDispatcher` (`route_set.rb:71-79`) is already ported and binds a
controller class; the `to.respond_to?(:action)` / `respond_to?(:call)` /
`Constraints` arms of `Mapper#app` are a separate concern from the
`raise_on_name_error` flag and need not move together.
