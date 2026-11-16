---
title: "Route set and url_for without double casts"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-actionpack
packages: [actionpack]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/action-dispatch/routing/route-set.ts` holds 22 `as unknown as` / `any`
hits and `routing/url-for.ts` 5; casts onto `UrlForHost` (5) and
`PolymorphicHost` (7) recur across routing. Rails:
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb`,
`url_for.rb`, `polymorphic_routes.rb`.

## Acceptance criteria

- [ ] `as unknown as` in `routing/` falls by at least 70%.
- [ ] `UrlForHost` / `PolymorphicHost` are reached through a `this`-typed
      function or `Included<>`, not a cast.
- [ ] Named-route helper modules keep the late-definition shape ratified
      in CLAUDE.md § "Module mixins" (`RoutesHelpers.with`).
