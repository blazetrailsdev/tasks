---
title: "ActionController::Base.templateResolver / _resolveTemplate has no Rails counterpart"
status: ready
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

`ActionController::Base` carries `static templateResolver?: (controller, action, format) => string | null` and a private `_resolveTemplate(action, options)` (`packages/actionpack/src/action-controller/base.ts`). `_resolveTemplate` is the old `_renderTemplate`, renamed in trails#8170 so that it no longer shadows the ported `ActionView::Rendering#_render_template` (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:126-143`). `Base#render` calls it on a bare `render()` when the lookup context has no view paths. It asks the resolver for a raw template string and writes it as the body with `text/html; charset=utf-8`.

Rails has no such hook. A bare `render` with no view paths goes through `_process_render_template_options` → `_render_template` and raises `ActionView::MissingTemplate` (`rendering.rb:118-122`, `actionview/lib/action_view/lookup_context.rb` `find`). Template lookup is always a `LookupContext` over `view_paths` resolvers (`actionview/lib/action_view/view_paths.rb`). Tests that need an in-memory template use `ActionView::FixtureResolver` (`actionview/lib/action_view/testing/resolvers.rb`).

Remaining users: `packages/actionpack/src/action-controller/rendering.test.ts` and `packages/actionpack/src/action-controller/controller/base.test.ts`.

## Converged shape

- `templateResolver` and `_resolveTemplate` are deleted.
- Their tests register a `FixtureResolver` via `prependViewPath` / `viewPaths`, which is the idiom `packages/actionview/src/actionpack/controller/layout.test.ts` already uses.
- A bare `render()` with no view paths reaches `renderToBody` and raises `MissingTemplate`, as in Rails.

## Acceptance criteria

- `grep templateResolver packages/` returns nothing.
- Both test files are ported onto `FixtureResolver`, with Rails' test names unchanged.
