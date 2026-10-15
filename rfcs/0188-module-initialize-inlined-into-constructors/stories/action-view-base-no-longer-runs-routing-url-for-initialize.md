---
title: "ActionView::Base no longer runs Routing::UrlFor#initialize when RoutingUrlFor includes it at boot"
status: in-progress
updated: 2026-10-15
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8959
claim: "2026-10-15T22:44:50Z"
assignee: "update-columns-builds-plain-object-arel-boundary-rekeys"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8856. `ActionDispatch::Routing::UrlFor#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:111-114`) is `@_routes = nil` then `super`.

The railtie includes the module into `ActionView::RoutingUrlFor` at boot (`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb`, the `action_view.setup_action_pack` initializer), so `ActionView::Base#initialize`'s `super()` (`actionview/lib/action_view/base.rb:244-259`) reaches it and every view starts with `@_routes = nil`.

trails had this through the module's symbol-keyed `initialize`, run by `initializeIncludedModules` in `ActionView::Base`'s constructor (`packages/actionview/src/base.ts`). trails#8856 removed that member when it inlined the body into `ActionController::Base`, `API` and `IntegrationTest`. The include into `RoutingUrlFor` happens at run time (`packages/trailties/src/trailties/action-view.ts:208`, and four actionview test files), so no constructor carries the line and a view's `_routes` now starts `undefined`.

Nothing reads the difference today, since every reader falls back to the route set. It is still a body Rails runs and trails does not.

## Acceptance criteria

- A view built after `RoutingUrlFor` includes `Routing::UrlFor` starts with `_routes` nil, by the mechanism RFC 0188 settles on for a module included at run time.
- `ActionView::Base`'s constructor carries the tag if the answer is an inlined segment, and `pnpm parity:api:inlined` is green.
- A TS-only test pins the starting value.
