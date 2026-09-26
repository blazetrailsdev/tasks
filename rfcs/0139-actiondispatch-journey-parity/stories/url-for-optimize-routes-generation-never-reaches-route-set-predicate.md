---
title: "url-for-optimize-routes-generation-never-reaches-route-set-predicate"
status: draft
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Routing::UrlFor#optimize_routes_generation?`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:227-229`)
is `_routes.optimize_routes_generation? && default_url_options.empty?`, where
`_routes` is a `RouteSet`, whose predicate is `route_set.rb:844-846`.

trails' `optimizeRoutesGeneration`
(`packages/actionpack/src/action-dispatch/routing/url-for.ts`) reads
`this._routes!.optimizeRoutesGeneration?.() ?? true`. `RouteSet` spells the
predicate `isOptimizeRoutesGeneration` (`routing/route-set.ts`), so the
optional call never resolves on a real `RouteSet` and the first conjunct is
always `true`.

Renaming the `UrlForRoutes` interface member to `isOptimizeRoutesGeneration`
fixes the call. But it gives `url_for.rb:optimize_routes_generation?` a
declaration-only candidate in `url-for.ts`, which un-matches that pair in
`parity:api` and makes its `body-pins.json` entry STALE (seen on trails#8163).
The fix has to converge the call without that regression. One option is typing
`_routes` against `RouteSet` without an interface member in `url-for.ts`.

## Acceptance criteria

- `optimizeRoutesGeneration` calls the `RouteSet` predicate unconditionally, as `url_for.rb:228` does, with no `?? true` fallback.
- `url_for.rb:optimize_routes_generation?` stays matched in `parity:api`, and `lint-body-pins` stays green.
- A test shows a `RouteSet` with non-empty `default_url_options` answers `false` through a `UrlFor` host.
