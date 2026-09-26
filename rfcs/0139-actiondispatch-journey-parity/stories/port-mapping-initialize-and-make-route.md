---
title: "port-mapping-initialize-and-make-route"
status: ready
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: ["mapper-mapping-is-instantiated-per-route"]
deps-rfc: []
est-loc: null
priority: 60
pr: null
claim: null
assignee: null
blocked-by: null
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
