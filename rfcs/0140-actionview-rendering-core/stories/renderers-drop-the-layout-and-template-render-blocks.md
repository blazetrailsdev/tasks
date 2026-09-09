---
title: "PartialRenderer/CollectionRenderer drop Rails' layout and template render blocks"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails hands the renderers' layout and template renders a **block**, and trails
drops both, substituting a `view_flow` write:

- `PartialRenderer#render_partial_template`
  (`vendor/rails/actionview/lib/action_view/renderer/partial_renderer.rb:251-255`)
  renders the template as
  `template.render(view, locals, add_to_stack: !block) { |*name| view._layout_for(*name, &block) }`
  and the layout as `layout.render(view, locals) { content }`.
- `CollectionRenderer#collection_with_template`
  (`collection_renderer.rb:196-198`) does the same:
  `content = layout.render(view, locals) { content } if layout`.

`packages/actionview/src/renderer/partial-renderer.ts` and
`renderer/collection-renderer.ts` instead do
`view.viewFlow?.set("layout", content)` before calling `layout.render(view, locals)`,
and pass no block to `template.render` at all — so the caller's block never
reaches `_layout_for`, and a partial rendered with a block cannot yield to it.

`TemplateRenderer#render_with_layout` is NOT an instance of this: Rails really
does write `view.view_flow.set(:layout, yield(layout))` there
(`template_renderer.rb:76`), so that call site is already faithful.

Sibling: `port-action-view-layouts-behind-rendering-stubs` ports
`ActionView::Layouts` and `_layout_for` itself; this story is about the renderer
call sites that are supposed to feed it.

## Converged shape

`Template#render` takes Rails' block parameter, `renderPartialTemplate` and
`collectionWithTemplate` pass the blocks Rails passes, and the `viewFlow` writes
at those two sites are deleted.

## Acceptance criteria

- `renderPartialTemplate` passes a block to both `template.render` and
  `layout.render`, matching `partial_renderer.rb:251-255`.
- `collectionWithTemplate` passes `layout.render`'s block, matching
  `collection_renderer.rb:198`.
- A partial rendered with a block can `yield` to it through `_layout_for`.
- `pnpm parity:api:calls` loses the corresponding rows rather than gaining any.
