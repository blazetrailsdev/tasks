---
title: "port RouteSet#url_for / #path_for at Rails signatures, reading camelCase option keys"
status: in-progress
updated: 2026-09-15
rfc: "0149-bare-keyed-option-hashes"
cluster: option-hash-key-names
packages: [actionpack]
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: trails#7806
claim: "2026-09-15T16:40:17Z"
assignee: "route-set-url-for-path-for-port"
blocked-by: null
closed-reason: null
---

## Context

Rails: `RESERVED_OPTIONS` (`actionpack/lib/action_dispatch/routing/route_set.rb:840`),
`path_for(options, route_name = nil, reserved = RESERVED_OPTIONS)` (`:852`) and
`url_for(options, route_name = nil, url_strategy = UNKNOWN, method_name = nil, reserved = RESERVED_OPTIONS)` (`:857`).
`url_for` merges `default_url_options`, deletes `:user` / `:password`, `find_script_name`s, calls `generate`,
and builds `:path` / `:params` before `url_strategy.call`.

trails: `packages/actionpack/src/action-dispatch/routing/route-set.ts:988-1011` has the invented
`pathFor(routeName, params)` and `urlFor(routeName, params, {host, onlyPath})`. `findScriptName` (`:806`) and
`generateExtras` (`:948`) read snake_case `script_name` / `use_route`, which converge to `scriptName` / `useRoute`. `UrlForRoutes.urlFor(options, routeName)`
(`routing/url-for.ts:25`) is the shape `fullUrlFor` already expects but nothing implements.

`UrlFor#full_url_for` (`actionpack/lib/action_dispatch/routing/url_for.rb:182-202`) is the only feeder of
`url_for(options, route_name)`: `options.delete :use_route`, then `reverse_merge!(url_options)`. trails' `fullUrlFor`
(`packages/actionpack/src/action-dispatch/routing/url-for.ts:54-81`) spreads instead and converges here. Per this RFC
it omits `symbolize_keys` (the options stay bare-keyed).

## Acceptance criteria

- `RouteSet#urlFor` / `#pathFor` match Rails' parameters, order and defaults, and read camelCase option keys (`onlyPath`, `scriptName`, per `docs/ruby-ts-conventions.md`).
- `fullUrlFor` deletes `useRoute` and `reverseMerge`s `urlOptions()`, with no `symbolizeKeys`.
- `RESERVED_OPTIONS` is ported. `findScriptName` reads `scriptName`.
- Callers of the old signatures are migrated. `route-set.test.ts` / `url-for.test.ts` stay green. `parity:api` credits both methods.
