---
title: "withRoutesHelpers' Proxy gives url helpers to the wired class itself, not only its subclasses"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `AbstractController::Railties::RoutesHelpers.with(routes, include_path_helpers = true)`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/railties/routes_helpers.rb:10-21`)
returns a module whose only method is `inherited(klass)`. It runs
`klass.include(routes.url_helpers(include_path_helpers))` (or the namespace's
`railtie_routes_url_helpers`) on each **subclass** as it is defined. The extended class
itself never includes the url helpers. So `ActionController::Base.new.respond_to?(:url_for)`
comes from `ActionController::UrlFor`, not from the app's url_helpers, and a named-route helper
such as `posts_path` is undefined on a bare `Base` instance.

trails' `withRoutesHelpers` (`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`)
defers `inherited`, which JS lacks, by splicing a Proxy directly above `cls.prototype`. That Proxy
answers reads for instances of `cls` itself as well as its subclasses. So:

- a `Base` instance (or an instance of whatever class is wired) resolves the url helpers,
  where Rails' does not;
- the file's trails-only tests (`routes-helpers.test.ts`) and
  `packages/actionview/src/rendering.trails.test.ts` wire a class and read helpers off
  that class's own instances. Rails' usage wires a parent (`action_controller/railtie.rb:70`,
  `actionpack/test/abstract_unit.rb:220-228`) and reads them off subclasses;
- `withRoutesHelpers` also assigns `cls._routes`, which `with` does not do. `_routes` reaches
  a Rails subclass only through the url_helpers module's own `included` block
  (`action_dispatch/routing/route_set.rb:573-582`).

A literal deferred `include(subclass, …)` at the subclass's first touch was tried in trails#8295
and rejected: `Base.testRoutes` (`abstract_unit.rb:229-234`) can include a second url-helpers
module into a subclass before that touch, and the deferred include would then land above it,
reversing Rails' `inherited`-first order. So the Proxy stays; what converges is who it answers.

## Acceptance criteria

- The Proxy answers url-helper reads only when the receiver's class is a strict subclass of
  the wired class, as `inherited` would have included them. A bare instance of the wired
  class resolves only what its own ancestry defines.
- `cls._routes` is no longer assigned by `withRoutesHelpers`. Anything that needs `_routes`
  reaches it through the url-helpers module, as `route_set.rb:573-582` provides it.
- `routes-helpers.test.ts` and `actionview/src/rendering.trails.test.ts` wire a parent and read
  helpers from a subclass instance.
- Every actionpack, actionview and trailties test file that imports `test-helpers/abstract-unit.js`
  or goes through trailties' `action_controller` railtie stays green.
