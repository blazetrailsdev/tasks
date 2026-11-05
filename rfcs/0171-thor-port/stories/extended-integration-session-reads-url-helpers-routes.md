---
title: "extended-integration-session-reads-url-helpers-routes"
status: done
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9753
claim: "2026-11-05T19:55:15Z"
assignee: "extended-integration-session-reads-url-helpers-routes"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Console::AppInstance` (`vendor/rails/v8.0.2/railties/lib/rails/commands/console/irb_console.rb:33-50`) builds an `ActionDispatch::Integration::Session` and `extend`s it with `app.routes.url_helpers`, so `app.foo_path` works at the console prompt.

In trails, `Session`'s constructor (`packages/actionpack/src/action-dispatch/testing/integration.ts:242-247`, inlining `UrlFor#initialize`'s `@_routes = nil`, `url_for.rb:111-114`) writes an own `_routes: null` data property. The url-helpers module's `_routes` accessor (`routing/route-set.ts:962-972`, Rails' `@_routes || routes`) is installed on the singleton class by `extend`, and the own `null` shadows it. So `session.fooPath()` raises `Cannot read properties of null (reading 'isOptimizeRoutesGeneration')` in `UrlFor#optimizeRoutesGeneration`.

## Acceptance criteria

- [ ] A `Session` extended with `routes.urlHelpers()` answers `fooPath()` for a drawn `get "foo"` route.
- [ ] `FullStackConsoleTest > app helper method` (`packages/trailties/src/application/console.test.ts`) is un-skipped and passes.
