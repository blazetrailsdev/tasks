---
title: "Routing UrlFor raises RuntimeError via _routes, not an invented requireRoutes Error"
status: draft
updated: 2026-09-11
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/routing/url-for.ts:146` (`requireRoutes`)
throws `new Error(NO_ROUTES_MESSAGE)`. Rails raises this message only from
`AbstractController::UrlFor#_routes`
(`vendor/rails/actionpack/lib/abstract_controller/url_for.rb:18-21`), with a
bare `raise "..."`, which is a `RuntimeError`. `requireRoutes` is a trails helper
with no Rails counterpart. Also, `NO_ROUTES_MESSAGE` in
`abstract-controller/url-for.ts` is a trails-only constant; PR trails#7684
inlined the literal into `_routes` the way Rails does.

## Acceptance criteria

- [ ] The routing UrlFor callers reach `_routes` (Rails' `ActionDispatch::Routing::UrlFor`
      calls `_routes` directly) instead of the invented `requireRoutes`, so the raise
      is `RuntimeError` from the one Rails site.
- [ ] `requireRoutes` and `NO_ROUTES_MESSAGE` are deleted.
