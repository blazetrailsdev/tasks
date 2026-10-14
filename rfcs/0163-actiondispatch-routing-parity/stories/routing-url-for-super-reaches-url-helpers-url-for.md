---
title: "routing-url-for-super-reaches-url-helpers-url-for"
status: claimed
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-10-14T17:46:22Z"
assignee: "port-actionview-polymorphic-routes-test-part-1"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::UrlFor`'s `included` block does
`include(*_url_for_modules) if respond_to?(:_url_for_modules)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:108`), and
`ActionView::Helpers::UrlHelper::ClassMethods#_url_for_modules` answers
`ActionView::RoutingUrlFor` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/url_helper.rb:30`).
So a view context class built by `build_view_context_class`
(`actionview/lib/action_view/rendering.rb:59-74`) gets `RoutingUrlFor` directly
below `routes.url_helpers`' `UrlFor`, and `RoutingUrlFor#url_for`'s `super`
reaches `ActionDispatch::Routing::UrlFor#url_for`.

trails mirrors the include (`packages/actionpack/src/action-dispatch/routing/url-for.ts:182`),
but `RoutingUrlFor#urlFor` (`packages/actionview/src/routing-url-for.ts:29-39`) is a
class method using static `super.urlFor`, whose home object is
`RoutingUrlFor.prototype`'s parent (`Object`). Copied into the view context by
`include`, it raises `TypeError: (intermediate value).urlFor is not a function`
unless something has first run the railtie's
`ActionView::RoutingUrlFor.include(ActionDispatch::Routing::UrlFor)`
(`actionview/lib/action_view/railtie.rb:100`). Tests paper over this by calling
`include(RoutingUrlFor, UrlFor)` at module level: `routing.test.ts`
(`TestMultipleNestedController`), `request-forgery-protection.test.ts:30`,
`url-helper.test.ts:64`, `form-helper.test.ts:121`, `form-with.test.ts:213`,
`rendering.trails.test.ts:13`.

## Acceptance criteria

- [ ] `RoutingUrlFor`'s `super` calls dispatch through the including class's
      chain (the ruby-compat `include` super idiom), so an inline template's
      `urlFor({ controller: "/pooh", action: "index" })` works with only the
      `_urlForModules` include, as in Rails' actionpack test suite.
- [ ] The test-level `include(RoutingUrlFor, UrlFor)` calls listed above are
      removed where they only stood in for this.
