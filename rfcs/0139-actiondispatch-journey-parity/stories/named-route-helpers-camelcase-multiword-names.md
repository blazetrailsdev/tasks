---
title: "named-route-helpers-camelcase-multiword-names"
status: done
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8156
claim: "2026-09-26T18:22:02Z"
assignee: "named-route-helpers-camelcase-multiword-names"
blocked-by: null
closed-reason: null
---

## Context

Rails names a route's helpers `"#{name}_path"` / `"#{name}_url"`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb`,
`NamedRouteCollection#add` → `define_url_helper`). Under trails' Ruby→TS name
rule (docs/ruby-ts-conventions.md), `admin_root_url` should be `adminRootUrl`.

trails' `NamedRouteCollection#add` and `#addUrlHelper`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:322-323,362-363`)
append the suffix to the raw name instead: `` `${name}Path` `` / `` `${name}Url` ``. A
multi-word route name like `as: "admin_root"` therefore produces
`admin_rootUrl`. `TestUrlConstraints` in
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` has to
reach it as `urlHelpersModule["admin_rootUrl"]` (trails#8135).

## Acceptance criteria

- Helper names follow the camelCase rule: `admin_root` gives `adminRootPath` / `adminRootUrl`.
- `TestUrlConstraints` reads `adminRootUrl` / `secureRootUrl` / `alternateRootUrl`.
- `NamedRouteCollection#helperNames` / `isRouteDefined` agree with the new spelling.
