---
title: "routing-barrel-exports-url-for-module-not-namespace"
status: draft
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
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

`packages/actionpack/src/action-dispatch/routing/index.ts` exports
`export * as UrlFor from "./url-for.js"` — a module _namespace_ object — under
the name Rails gives the module itself, `ActionDispatch::Routing::UrlFor`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:92`).
`url-for.ts` already defines the real `UrlFor` (`new Module(...)` extended with
`Concern`, with its `initialize` on `moduleInitialize`, `url_for.rb:111-114`),
but the barrel shadows it. `parity:api:extra` scores the barrel's `UrlFor` as a
moved row (`routing/index.ts — 0 novel, 1 moved`).

The one consumer is trailties' `action_view.setup_action_pack` initializer
(`packages/trailties/src/trailties/action-view.ts`,
`include(RoutingUrlFor, new Module((mod) => mod.include(UrlFor)))`), which
therefore includes the namespace's flattened functions, not the Concern. Rails
does `ActionView::RoutingUrlFor.include(ActionDispatch::Routing::UrlFor)`
(`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:97-101`).

Tried in `journey-routing-parity-closing-sweep`: switching the barrel to
`export { UrlFor } from "./url-for.js"` reds all three
`action_view.setup_action_pack` tests in
`packages/trailties/src/trailties/action-view.trails.test.ts` with
`TypeError: Cannot read properties of undefined (reading 'Symbol(@blazetrails/ruby-compat:includedModules)')`
— including the Concern-extended module into the wrapper `Module` takes a
ruby-compat path that does not handle it yet.

## Acceptance criteria

- `routing/index.ts` exports the real `UrlFor` Module (no `export * as UrlFor`).
- trailties' `action_view.setup_action_pack` includes `UrlFor` into
  `RoutingUrlFor` the way `railtie.rb:97-101` does, with any ruby-compat
  `include`/`Concern` fix needed to support it, and its three trails tests pass.
- `pnpm parity:api:extra --package actiondispatch` shows no `routing/index.ts`
  `UrlFor` row.
