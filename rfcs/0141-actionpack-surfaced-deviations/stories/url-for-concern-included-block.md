---
title: "ActionDispatch::Routing::UrlFor is a namespace, not a Concern, so its included block never reaches a url_helpers includer"
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

Rails' `ActionDispatch::Routing::UrlFor`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:92-108`)
is an `ActiveSupport::Concern` with an `included` block. That block defines a
`default_url_options` class attribute (`{}`) unless the includer already has
one. It then includes `_url_for_modules`, which is `ActionView::RoutingUrlFor`
for a view class.

trails' UrlFor is the `url-for.ts` namespace (`routing/index.ts`:
`export * as UrlFor`). That namespace cannot carry an `included` hook, and it
is not a Concern. Two consequences:

- `RouteSet#generate_url_helpers` (`routing/route-set.ts`, `generateUrlHelpers`)
  does `self.include(UrlFor)` into a Concern module. In Rails, Concern turns
  that include into a dependency (`concern.rb` `append_features`), and
  UrlFor's `included` block runs on the final includer. In trails the methods
  are flattened into the module and the block never runs. So:
  - the url_helpers module's own `included` block also seats
    `defaultUrlOptions` on the includer, which is UrlFor's arm, not its own
    (`route_set.rb:617-619` only redefines `_routes`);
  - `proxyClass` declares a `defaultUrlOptions = {}` field in place of the
    class attribute UrlFor's block would give it;
  - the `include(*_url_for_modules) if respond_to?(:_url_for_modules)` arm is
    not ported. So a view context class never gains `RoutingUrlFor` through
    `buildViewContextClass` (`actionview/src/rendering.ts`), even though
    `ActionView::Helpers::UrlHelper._urlForModules` exists
    (`actionview/src/helpers/url-helper.ts`).
- `trailties/src/trailties/action-view.ts` flattens UrlFor into a `Module` for
  `RoutingUrlFor` the same way.

Separately, `private :_generate_paths_by_default` (`route_set.rb:628`) is not
ported. `rbModPrivate` keys visibility on a class prototype, and a ruby-compat
`Module` has only its carrier.

## Acceptance criteria

- UrlFor is a Concern module value with its `included` block, and a Concern
  module that includes it records it as a dependency. So including the
  url_helpers module runs UrlFor's block on the includer.
- `generateUrlHelpers`' `included` block is only
  `redefine_singleton_method(:_routes) { routes }`, and `proxyClass` has no
  `defaultUrlOptions` field.
- UrlFor's `include(*_url_for_modules) if respond_to?(:_url_for_modules)` arm
  is ported.

Out of scope: the ancestry order `_url_for_modules` lands in and
`private :_generate_paths_by_default` are
`url-for-module-private-initialize-and-url-for-modules-order`. The railtie's
wrapper `Module` is `url-for-is-a-plain-object-module-not-a-linkable-module`.
