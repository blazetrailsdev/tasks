---
title: "url-for-included-hook-includes-url-for-modules"
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-url-helper-and-include-routing-url-for` ported the `UrlHelper` slice that
names `ActionView::RoutingUrlFor`. That is `ClassMethods#_url_for_modules`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/url_helper.rb:29-33`),
extended onto `ActionView::Base` in `packages/actionview/src/base.ts`. Nothing
reads it yet.

Rails reads it from `ActionDispatch::Routing::UrlFor`'s `included` block
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:95-109`):

```ruby
included do
  ...
  include(*_url_for_modules) if respond_to?(:_url_for_modules)
end
```

`routes.url_helpers` is `Module.new { extend ActiveSupport::Concern; include UrlFor; ... }`
(`route_set.rb:538-560`), and `build_view_context_class` includes it into the
view subclass (`actionview/lib/action_view/rendering.rb:66`). That is how every
controller's view class ends up answering `RoutingUrlFor#url_for`.

In trails:

- `UrlFor` is `export * as UrlFor from "./url-for.js"`
  (`packages/actionpack/src/action-dispatch/routing/index.ts:55`), a plain
  namespace. It has no `[included]` hook and no `default_url_options`
  class_attribute arm.
- `buildViewContextClass` (`packages/actionview/src/rendering.ts`) does
  `include(subclass, routes.urlHelpers(supportsPath))`. `UrlHelpersModule`
  (`route-set.ts`) copies its own bound `urlFor` etc. onto the view class.
- `RoutingUrlFor#urlFor`'s `super.urlFor` only resolves once the
  `action_view.setup_action_pack` on-load include has spliced `UrlFor` beneath
  it (`packages/trailties/src/trailties/action-view.ts`). Wiring the hook
  without that splice turns every view `urlFor` into a `TypeError`.

## Acceptance criteria

- Including `routes.urlHelpers()` into a class that answers `_urlForModules`
  includes `RoutingUrlFor` into it, per `url_for.rb:108`, through the
  `included` symbol hook from `@blazetrails/ruby-compat`.
- A controller's view context class answers `urlFor(":back")` and
  `urlFor({ controller, action })` through `RoutingUrlFor`, with `onlyPath`
  defaulting to true (`routing_url_for.rb:139-143`).
- The `UrlHelperTest` cases that include `routes.url_helpers`
  (`actionview/test/template/url_helper_test.rb:23-50`) can build their host
  that way.
