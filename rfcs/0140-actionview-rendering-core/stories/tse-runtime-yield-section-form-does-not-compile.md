---
title: "tse-runtime-yield-section-form-does-not-compile"
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: ["template-renderer-passes-layout-for-blocks"]
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`<%= yield %>` in a `.tse` template resolves at runtime through the `yield`
getter `ActionView::Base` installs (`packages/actionview/src/base.ts:375-381`),
which returns `this._layoutFor()` with no argument. The compiled body runs in
sloppy mode under `with (this)` (`packages/actionview/src/template.ts:325`), so
bare `yield` is an identifier there.

Rails' section form has no runtime equivalent in trails:

- `yield :sidebar` in Ruby calls the block `TemplateRenderer` hands the
  template — `{ |*name| view._layout_for(*name) }`
  (`vendor/rails/actionview/lib/action_view/renderer/template_renderer.rb:66,77`)
  — so it reaches `_layout_for(:sidebar)`
  (`actionview/lib/action_view/helpers/rendering_helper.rb:207-215`).
- In a `.tse` body, `yield "sidebar"` is a JS SyntaxError (identifier followed
  by a string), and `yield("sidebar")` is a TypeError (the getter returns a
  `SafeBuffer`, not a function).

The virtualized TypeScript emitter (`packages/trails-tsc/src/plugins/tse.ts`,
`contextYield`) now binds both spellings to `RenderContext#yield(section?)`, so
the editor type-checks a layout the runtime cannot compile. The two must agree.

## Acceptance criteria

- A `.tse` layout containing `<%= yield "sidebar" %>` (or the chosen single
  spelling) renders `_layoutFor("sidebar")` at runtime, matching Rails'
  `yield :sidebar`.
- The runtime and the `trails-tsc` virtualizer accept the same set of `yield`
  spellings; a test renders one through `ActionView::Base` and type-checks the
  same source through `virtualizeTse`.
