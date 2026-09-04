---
title: "port-optimized-url-helper-and-rails-shape-url-for"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-named-route-collection-url-helper-modules` ported
`NamedRouteCollection` and its `path_helpers_module` / `url_helpers_module`
pair (`actionpack/lib/action_dispatch/routing/route_set.rb:60-348`), so a
named route answers `postsPath` / `postsUrl` on a controller and a view. Two
pieces of that Ruby are still open, and both carry `@missingRailsCall`
receipts pointing here in
`packages/actionpack/src/action-dispatch/routing/route-set.ts`:

- **`UrlHelper::OptimizedUrlHelper`** (`route_set.rb:206-270`).
  `UrlHelper.create` picks it whenever
  `route.path.requirements.empty? && !route.glob?` (`:199-201`); trails'
  `create` always answers the generic helper, so the fast path — positional
  args formatted straight through `@route.format params`, with
  `find_script_name` and `trailing_slash` handling — is absent. The two
  produce the same string today; the receipt is
  `@missingRailsCall optimize_helper?`.

- **`RouteSet#url_for(options, route_name = nil, url_strategy = UNKNOWN,
method_name = nil, reserved = RESERVED_OPTIONS)`**. trails' `RouteSet#urlFor`
  still carries a pre-Rails positional `(routeName, params, options)`
  signature, which is why `UrlHelper#call` reaches `generate` (the port of the
  private `generate` Rails' `url_for` calls) and hands the strategy a `path`
  rather than calling `url_for` as `route_set.rb:289` does. The same gap is
  what makes `UrlHelpersModule#urlFor` throw "RouteSet#urlFor needs the
  Rails-shape (options, routeName?) signature". Receipt:
  `@missingRailsCall url_for`.

## Acceptance criteria

- `RouteSet#urlFor` takes Rails' `(options, routeName, urlStrategy,
methodName, reserved)` shape and `UrlHelper#call` calls it, deleting that
  receipt and the `route-set.ts` "needs the Rails-shape signature" throw.
- `OptimizedUrlHelper` is ported with `optimize_helper?` selecting it in
  `UrlHelper.create`, deleting that receipt.
- `pnpm parity:api:calls` stays green and the `NamedRouteCollection` covers
  keep passing.
