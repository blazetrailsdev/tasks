---
title: "TemplateRenderer passes Rails' _layout_for blocks to template and layout render"
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TemplateRenderer#render_template` renders the template with a block,
`template.render(view, locals) { |*name| view._layout_for(*name) }`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/template_renderer.rb:66`), and
`render_with_layout` renders the layout the same way (`:77`). trails'
`renderer/template-renderer.ts` `renderTemplate` / `renderWithLayout` pass no block; a
template's `yield` falls back to `Base`'s `yield` getter (`base.ts`), which answers the
same value only because the getter hard-codes `_layoutFor()`.

PR #8136 added the block parameter to `Template#render` (`template.rb:271`) and the
compiled `_` block, so the call sites can now pass it.

## Acceptance criteria

- `renderTemplate` passes `(...name) => view._layoutFor!(...name)` to `template.render`, per `template_renderer.rb:66`.
- `renderWithLayout` passes the same block to `layout.render`, per `:77`.
- `view.viewFlow.set("layout", ...)` at `:76` stays (it is faithful).
