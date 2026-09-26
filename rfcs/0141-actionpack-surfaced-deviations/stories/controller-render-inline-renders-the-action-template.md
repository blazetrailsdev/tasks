---
title: "ActionController render(inline:) renders the action template instead of the inline source"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `render inline: "..."` is handled by `ActionView::Rendering` /
`TemplateRenderer#determine_template` (`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/template_renderer.rb`,
the `options.key?(:inline)` arm building `Template::Inline`), and
`Layouts#_include_layout?` (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:430-432`)
skips the default layout for it.

trails' `ActionController::Base#render` (`packages/actionpack/src/action-controller/base.ts`)
has no `inline` arm and `RenderOptions` declares no `inline` key. A
`render({ inline })` falls into the template branch, so `renderAsync` renders
the action's template (`_processRenderTemplateOptions` sets
`template ??= actionName`) and the inline source is ignored. Only the layout is
right, because `_isIncludeLayout` now sees the `inline` key. The actionview
side already has `Inline` (`packages/actionview/src/template/inline.ts`) and
the `inline:` arm in `renderer/template-renderer.ts`.

## Acceptance criteria

- `ActionController::Base#render({ inline, locals, type })` passes `inline:`
  through to `view.viewRenderer.render`, as Rails' `_render_template` does, and
  renders without the default layout unless `layout:` is given.
- `RenderOptions` declares `inline`.
- Port `vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb`'s inline
  cases (`test_render_inline*`) with Rails' names verbatim.
