---
title: "UrlFor module: private _generate_paths_by_default, initialize, and _url_for_modules ancestry order"
status: draft
updated: 2026-09-27
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

trails#8185 made `ActionDispatch::Routing::UrlFor` a Concern `Module`
(`packages/actionpack/src/action-dispatch/routing/url-for.ts`, `UrlFor`). It
carries its `included` block (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:97-108`),
and `RouteSet#generate_url_helpers` includes it as a Concern dependency. Four
pieces of that shape are still off:

- `private :_generate_paths_by_default` (`route_set.rb:628`) is not ported.
  `rbModPrivate` (`packages/ruby-compat/src/object.ts`) keys visibility on a
  class prototype, and a ruby-compat `Module` has only its carrier.
- `UrlFor#initialize` (`url_for.rb:111-114`, `@_routes = nil; super`) is not
  part of the module. trails spells the `@_routes` ivar and the `_routes`
  method as one property. So a `[initialize]` hook that sets `_routes = null`
  on each instance would shadow the url_helpers module's `_routes`
  (`route_set.rb:621`, `@_routes || routes`) and break named helpers in views.
- `include(*_url_for_modules)` includes `ActionView::RoutingUrlFor`, a class
  module. `include()` copies a class module's members onto the includer's
  prototype, so they sit ABOVE the url_helpers module's link. In Rails the
  ancestry is `[view, url_helpers, RoutingUrlFor, UrlFor]`, and the url_helpers
  module's `_generate_paths_by_default` (`supports_path`) wins over
  `RoutingUrlFor#_generate_paths_by_default` (`true`,
  `actionview/lib/action_view/routing_url_for.rb`).
- `trailties/src/trailties/action-view.ts` still includes the `url-for.ts`
  namespace into `RoutingUrlFor` through a wrapper `Module`, not the `UrlFor`
  module (`railtie.rb:97-101`).

## Acceptance criteria

- `_generatePathsByDefault` is private on the url_helpers module
  (`rbObjRespondTo(view, "_generatePathsByDefault")` is false, and true with
  `priv`).
- `UrlFor` carries its `initialize`, and a view built with
  `buildViewContextClass` still resolves `_routes` to the route set.
- A view context class built with `supportsPath = false` answers
  `_generatePathsByDefault()` with `false`.
- The action_view railtie does `include(RoutingUrlFor, UrlFor)` with the module.
