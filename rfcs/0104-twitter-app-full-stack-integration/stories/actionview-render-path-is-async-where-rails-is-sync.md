---
title: "actionview-render-path-is-async-where-rails-is-sync"
status: ready
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
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

`ActionView::Renderer#render` is synchronous in Rails
(`vendor/rails/actionview/lib/action_view/renderer/renderer.rb`), as is the
whole partial path below it (`PartialRenderer#render`,
`TemplateRenderer#render`, `Template#render` → `Base#_run`). A compiled
template method calls `render` inline and appends its return value to the
output buffer.

trails made the renderer async: `Renderer#render` / `#renderPartial`
(`packages/actionview/src/renderer/renderer.ts`), `TemplateRenderer#render`,
`PartialRenderer#render` and `Template#render`
(`packages/actionview/src/template.ts:127`) all return promises. A compiled
`.tse` method is an ordinary synchronous function, so it cannot await one — an
`await`-less call would append `[object Promise]`.

Two workarounds exist today because of it, both marked at the call site:

- `LookupContext#renderPartialSync`
  (`packages/actionview/src/lookup-context.ts`) — a synchronous partial path
  that duplicates the async `renderPartial` immediately above it and throws if
  a handler returns a promise.
- `Base#render` (`packages/actionview/src/base.ts`) routes to that instead of
  Rails' `view_renderer.render(self, options)`
  (`helpers/rendering_helper.rb:138`), and carries a `@missingRailsCall` for it.

Because `Base#render` cannot reach the real renderer, it also handles only the
`partial:` arm — Rails' `render` dispatches on the options shape
(`rendering_helper.rb:139-141`, `in_rendering_context`).

## Converged shape

Make the render path synchronous end to end, as Rails' is, and delete
`renderPartialSync`. Then `Base#render` becomes
`view_renderer.render(self, options)` with Rails' full option dispatch, and the
`@missingRailsCall` / `@noRailsEquivalent` receipts on both go away.

The blocker to check first is why the path went async at all — if a resolver
must do async I/O, Rails' answer is that resolvers read and cache templates
outside the render call, not inside it.

## Acceptance criteria

- `Renderer#render`, `TemplateRenderer#render`, `PartialRenderer#render` and
  `Template#render` are synchronous, matching their Rails signatures.
- `LookupContext#renderPartialSync` is deleted.
- `Base#render` matches `rendering_helper.rb:138-141` including the option
  dispatch, and its `@missingRailsCall` receipt is gone.
