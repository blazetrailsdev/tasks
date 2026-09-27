---
title: "UrlFor module: private _generate_paths_by_default and _url_for_modules ancestry order"
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
(`packages/actionpack/src/action-dispatch/routing/url-for.ts`, `UrlFor`), with
its `included` block (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:97-108`)
and `initialize` (`:111-114`). Two pieces of the url_helpers module's shape
are still off:

- `private :_generate_paths_by_default` (`route_set.rb:628`) is not ported.
  `rbModPrivate` (`packages/ruby-compat/src/object.ts`) keys visibility on a
  class prototype, and a ruby-compat `Module` has only its carrier.
- `include(*_url_for_modules)` includes `ActionView::RoutingUrlFor`, a class
  module. `include()` copies a class module's members onto the includer's
  prototype, so they sit ABOVE the url_helpers module's link. In Rails the
  ancestry is `[view, url_helpers, RoutingUrlFor, UrlFor]`, and the url_helpers
  module's `_generate_paths_by_default` (`supports_path`) wins over
  `RoutingUrlFor#_generate_paths_by_default` (`true`,
  `actionview/lib/action_view/routing_url_for.rb`).

The railtie's wrapper `Module` is
`url-for-is-a-plain-object-module-not-a-linkable-module`.

## Acceptance criteria

- `_generatePathsByDefault` is private on the url_helpers module
  (`rbObjRespondTo(view, "_generatePathsByDefault")` is false, and true with
  `priv`).
- A view context class built with `supportsPath = false` answers
  `_generatePathsByDefault()` with `false`.
