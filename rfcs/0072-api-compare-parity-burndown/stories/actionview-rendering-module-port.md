---
title: "Port ActionView::Rendering"
status: draft
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Rendering` (`vendor/rails/actionview/lib/action_view/rendering.rb`)
is 2/28 in api:compare. It was 4/28 until PR #5350, which deleted the
`ViewPaths`/`ViewPathsClass` placeholder interfaces in
`packages/actionview/src/rendering.ts` — `ActionView::Rendering` includes
`ActionView::ViewPaths` (rendering.rb:10), so two of the names it was credited
with were coming from those placeholders rather than from a real port. They
return once `rendering.rb` itself is ported.

What remains in `rendering.ts` is still placeholder interfaces (`Rendering`,
`Layouts`, `LayoutsClass`), marked `@internal stub - real impl in Phase 4`.

`ActionView::ViewPaths` is now fully ported at
`packages/actionview/src/view-paths.ts` (17/17), so the include side of this
module has something real to lean on.

## Acceptance criteria

- `packages/actionview/src/rendering.ts` carries `ActionView::Rendering`'s own
  surface (`view_context_class`, `view_context`, `view_renderer`,
  `_render_template`, `_process_format`, `_process_render_template_options`,
  `build_view_context_class`, `inherit_view_context_class?`, the `process`
  override and the `locale`/`locale=` and `lookup_context` members it defines)
  rather than stub interfaces.
- The remaining `@internal stub` interfaces in that file are gone, per
  CLAUDE.md's no-placeholder rule — anything not implemented is left out.
- api:compare `rendering.rb` improves on 2/28.
