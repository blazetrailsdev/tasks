---
title: "port-mapping-initialize-and-make-route"
status: blocked
updated: 2026-09-29
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: ["mapper-mapping-is-instantiated-per-route"]
deps-rfc: []
est-loc: null
priority: null
pr: trails#8162
claim: "2026-09-26T21:02:02Z"
assignee: "port-mapping-initialize-and-make-route"
blocked-by: "AC1 shipped in trails#8162, AC2 in trails#8160; dep mapper-mapping-is-instantiated-per-route is done (trails#8134). AC3 (drop addRouteToSet's Mapping.build — still at origin/main mapper.ts:1798,1824) waits only on mapper-resources-hand-builds-canonical-routes (RFC 0141, ready/unclaimed 2026-09-29). Unblock when that lands."
closed-reason: null
---

## Context

trails#8134 instantiates `Mapper::Mapping` per route through `Mapping.build` / `new`,
and moves `blocks`, `app`, `dispatcher`, `application` and `normalize_defaults`
onto it (`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:90-102,132-189,198-200,322-376`).
The rest of `Mapping#initialize` is still spread across
`Mapper#addRoute` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`) and
the trails `Route` constructor (`routing/route.ts`):

- `normalize_options!` (`mapper.rb:220-251`): `addRoute` resolves controller/action
  itself (`parseEndpoint`, the scope-module prefixing).
- the `constraints` merge, `split_constraints`, `verify_regexp_requirements`,
  `normalize_format` and `@requirements` / `@conditions` (`mapper.rb:151-181`):
  `addRoute` still merges scope constraints with a Hash `options_constraints`
  onto the `Route`, repeating the branch `Mapping`'s constructor now owns.
- `make_route` (`mapper.rb:185-190`): `RouteSet#addRoute` receives a trails
  `Route`, not the `Mapping`, so there is no `@set.add_route(name, mapping)` →
  `mapping.make_route(name, precedence)` hand-off.
- the constructor accepts `set:`, `ast:`, `formatted:`, `via:` and `anchor:` and
  stores none of them, because `make_route` / `conditions` / `request_method`
  (their readers) are unported.
- resource routes are built as `Route`s directly and reach `Mapping.build`
  only through `Mapper#addRouteToSet`'s default argument, where Rails routes
  every one through `match` → `decomposed_match` → `add_route` (`mapper.rb:2023-2063`).

## Acceptance criteria

- `Mapping#initialize` computes `@defaults`, `@requirements`, `@conditions`,
  `@required_defaults` and `@path` as `mapper.rb:132-181` does, and `addRoute`
  no longer merges constraints itself.
- `RouteSet#addRoute` takes the mapping and calls `mapping.makeRoute(name, precedence)`.
- `Mapper#addRouteToSet`'s default-argument `Mapping.build` is gone because
  every route arrives with its mapping.
