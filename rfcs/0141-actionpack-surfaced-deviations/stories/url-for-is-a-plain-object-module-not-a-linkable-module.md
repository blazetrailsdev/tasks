---
title: "url-for-is-a-plain-object-module-not-a-linkable-module"
status: ready
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionDispatch::Routing::UrlFor` is a Ruby module (`actionpack/lib/action_dispatch/routing/url_for.rb`), and
`actionview/lib/action_view/railtie.rb:97-101` does `ActionView::RoutingUrlFor.include(ActionDispatch::Routing::UrlFor)`
so that `RoutingUrlFor#url_for` / `#url_options` / `#optimize_routes_generation?` reach it through `super`
(`actionview/lib/action_view/routing_url_for.rb:80-136`).

trails exports `UrlFor` as a plain module namespace (`packages/actionpack/src/action-dispatch/routing/index.ts`,
`export * as UrlFor from "./url-for.js"`). ruby-compat's `include()` flattens a plain-object module onto the class
prototype beneath the class's own methods (`packages/ruby-compat/src/include.ts`, plain-object branch), so
`super` can never reach it. trails#8037 worked around this in the `action_view.setup_action_pack` hook
(`packages/trailties/src/trailties/action-view.ts`) by including `new Module((mod) => mod.include(UrlFor))`,
an anonymous wrapper module Rails does not have.

## Acceptance criteria

- `UrlFor` is a live ruby-compat `Module` (or otherwise links into the includer's ancestry), so the hook reads
  `include(RoutingUrlFor, UrlFor)` exactly as `railtie.rb:99` does, with no wrapper `Module`.
- Every other `include(X, UrlFor)` site keeps its behavior; `packages/trailties/src/trailties/action-view.trails.test.ts`
  and `packages/actionview/src/routing-url-for.trails.test.ts` stay green.
