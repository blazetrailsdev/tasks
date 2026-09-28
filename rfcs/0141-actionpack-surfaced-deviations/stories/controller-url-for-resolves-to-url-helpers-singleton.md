---
title: "A controller's urlFor reaches the url_helpers module singleton instead of ActionDispatch::Routing::UrlFor#url_for"
status: done
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8209
claim: "2026-09-28T02:00:53Z"
assignee: "authentication-generator-cookie-session-end-to-end"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8165. `UrlHelpersModule` (`packages/actionpack/src/action-dispatch/routing/route-set.ts`) binds the module-singleton `urlFor`, `fullUrlFor`, `routeFor` and `polymorphic*` as own enumerable properties. `withRoutesHelpers` (`abstract-controller/trailties/routes-helpers.ts`) splices those into a controller's prototype chain. So `controller.urlFor(...)` goes through `this._proxy.urlFor`, whose scope `urlOptions` is `routes.defaultUrlOptions` alone.

In Rails those are singleton methods of the `url_helpers` module (`action_dispatch/routing/route_set.rb:565-591`) and are never included into a controller. A controller's `url_for` is `ActionDispatch::Routing::UrlFor#url_for` (`action_dispatch/routing/url_for.rb:176-201`), included through `ActionController::UrlFor` (`action_controller/metal/url_for.rb:28-30`). It reads the controller's own `url_options`, so it sees the request host and `_recall`. #8165 removed only the `urlOptions` bind.

## Acceptance criteria

- A controller's `urlFor` / `fullUrlFor` / `routeFor` / `polymorphicUrl` resolve to `ActionDispatch::Routing::UrlFor`'s instance methods and read `this.urlOptions()`.
- A controller action calling `urlFor({ controller: "posts", action: "index" })` against the boot-app fixture yields the request host.
- Module-level calls (`routes.urlHelpers().urlFor(...)`) keep working.
