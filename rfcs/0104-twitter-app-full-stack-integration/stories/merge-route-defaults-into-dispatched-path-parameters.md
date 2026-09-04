---
title: "Merge route.defaults into the dispatched path parameters"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Journey::Router#find_routes` builds the dispatched request's path parameters as
`tmp_params = set_params.merge route.defaults`, then overlays the matched
parameters (`vendor/rails/actionpack/lib/action_dispatch/journey/router.rb:45-50`),
so a route's `defaults:` reach the controller.

trails' `RouteSet#call` does that in its mounted-app branch
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`, the
`mountedApp` arm spreads `...route.defaults`) but not in the dispatcher arm,
which builds:

```ts
env["action_dispatch.request.path_parameters"] = {
  controller: route.controller,
  action: route.action,
  ...params,
};
```

`route.defaults` is dropped, and because trails' `Route` keeps `controller` /
`action` as their own fields rather than folding them into `defaults` the way
Rails' `Mapping` does, a route declared as
`get "/x/:action", { defaults: { controller: "posts" } }` has
`route.controller === ""` — so the write actively overwrites the default with
the empty string and the dispatcher resolves `Controller` instead of
`PostsController`.

`buildJourneyRouter` (`routing/journey-bridge.ts`) has the same shape in the
Journey route's `defaults: { ...r.defaults, controller: r.controller, action:
r.action }`.

Surfaced by PR #7368's per-route dispatcher: the raise arm now fires for a
`defaults:`-pinned controller, which is what exposed the wrong constant name.
`dispatcher.test.ts`'s "raises ActionController::RoutingError when defaults pin
the controller" asserts the error class rather than the constant name for
exactly this reason.

## Acceptance criteria

- `RouteSet#call`'s dispatcher arm merges `route.defaults` under the matched
  parameters, mirroring `router.rb:45-50`, and does not overwrite a defaulted
  `:controller` / `:action` with the `Route`'s empty field.
- `buildJourneyRouter` builds the Journey route's `defaults` the same way.
- The test above asserts `uninitialized constant PostsController`.
