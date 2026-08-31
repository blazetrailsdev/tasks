---
title: "template-render-takes-view-before-locals"
status: in-progress
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 6
pr: 7302
claim: "2026-08-31T15:54:33Z"
assignee: "template-render-takes-view-before-locals"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Template#render` takes the view first:
`template.render(view, locals)` and `layout.render(view, locals)`
(`vendor/rails/actionview/lib/action_view/renderer/template_renderer.rb:65,76`),
matching `ActionView::Template#render(view, locals, buffer = nil, add_to_stack:
true, has_strict_locals: false, &block)`
(`vendor/rails/actionview/lib/action_view/template.rb:159`).

trails reverses the pair: `Template#render(locals, context)`
(`packages/actionview/src/template.ts`), so every call site passes
`render(locals, view)` — `packages/actionview/src/renderer/template-renderer.ts:
90,93,95`, and the same shape in `partial-renderer.ts` and
`streaming-template-renderer.ts`.

`param-drift-actionview` surfaced this: renaming `renderWithLayout`'s first
parameter from `context` to Rails' `view` (`template_renderer.rb:71`) turned the
`parity:api:calls:args` row from `naming` (report-only) into `shape`, because
both identifiers now match Rails' and only the ORDER differs. It is carried as a
`@missingRailsArgs template.render — CONVERGEABLE <this story>` receipt at
`template-renderer.ts:90` pending this convergence.

## Acceptance criteria

- `Template#render` takes `(view, locals, ...)` in Rails' order, and every call
  site in `packages/actionview/src` passes them that way.
- The `@missingRailsArgs` receipt at `renderer/template-renderer.ts` is deleted,
  and `pnpm parity:api:calls:args` reports no row for
  `renderer/template-renderer.ts#render_with_layout`.
- No test renamed; `pnpm parity:api` methods/arity/params figures unmoved.
