---
title: "actionpack: UrlFor's @_routes ivar and the _routes reader are one property"
status: draft
updated: 2026-10-06
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::UrlFor#initialize` sets an ivar, `@_routes = nil`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:111-114`), and
`_with_routes` swaps that ivar (`url_for.rb:232-237`). The `_routes` READER is a different
thing: a method the generated url_helpers module defines as `@_routes || routes`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb`, `generate_url_helpers`).

trails spells both as the one property `_routes`. `UrlFor`'s initializer
(`packages/actionpack/src/action-dispatch/routing/url-for.ts`, the `moduleInitialize` hook)
wrote `this._routes = null`, which created an OWN data property on a controller whose class had
no `_routes` accessor yet. That property then shadowed the reader a later
`@controller.singleton_class.include @routes.url_helpers` adds
(`vendor/rails/v8.0.2/actionview/test/abstract_unit.rb:119-126`), so `redirect_to action: "show"`
read a null route set.

The PR that ported `actionview/test/activerecord/controller_runtime_test.rb` narrowed the
initializer to `if ("_routes" in this) this._routes = null;`, an arm Rails does not have.
`_withRoutes` (`url-for.ts`) still reads and writes the `_routes` property where Rails touches
the ivar, and `generateUrlHelpers` (`route-set.ts`) keeps a per-module `Symbol("@_routes")`.

## Acceptance criteria

- [ ] `@_routes` is one ivar key shared by `UrlFor#initialize`, `_with_routes` and the
      url_helpers `_routes` reader, distinct from the `_routes` method name.
- [ ] The `"_routes" in this` guard in `UrlFor`'s initializer is deleted; the body is the
      unconditional `@_routes = nil` of `url_for.rb:112`.
- [ ] `packages/actionview/src/activerecord/controller-runtime.test.ts`
      (`log with active record when redirecting`) and
      `packages/actionpack/src/action-dispatch/routing/url-for.test.ts` stay green.
