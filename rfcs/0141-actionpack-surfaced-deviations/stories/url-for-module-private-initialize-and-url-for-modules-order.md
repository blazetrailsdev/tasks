---
title: "UrlFor module: _url_for_modules ancestry order (url_helpers' _generate_paths_by_default must win over RoutingUrlFor's)"
status: ready
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
and `initialize` (`:111-114`). One piece of the url_helpers module's shape
is still off:

- `include(*_url_for_modules)` includes `ActionView::RoutingUrlFor`, a class
  module. `include()` copies a class module's members onto the includer's
  prototype, so they sit ABOVE the url_helpers module's link. In Rails the
  ancestry is `[view, url_helpers, RoutingUrlFor, UrlFor]`, and the url_helpers
  module's `_generate_paths_by_default` (`supports_path`) wins over
  `RoutingUrlFor#_generate_paths_by_default` (`true`,
  `actionview/lib/action_view/routing_url_for.rb`).

The railtie's wrapper `Module` is
`url-for-is-a-plain-object-module-not-a-linkable-module`.

`private :_generate_paths_by_default` (`route_set.rb:628`) is not part of this
story: trails carries no method visibility at run time (CLAUDE.md § "Method
visibility is compile-time only"), so the member is marked `@internal` and
nothing else is ported for it.

## Acceptance criteria

- A view context class built with `supportsPath = false` answers
  `_generatePathsByDefault()` with `false`.
