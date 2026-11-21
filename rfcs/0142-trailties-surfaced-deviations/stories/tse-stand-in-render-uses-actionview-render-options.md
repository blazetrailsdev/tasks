---
title: "trails-tsc stand-in render takes actionview's RenderOptions, collection arm included"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#10490 a template's bare `render` is typed by the stand-in `RenderContext` in
`packages/trails-tsc/lib/plugins/tse.ts` (`buildPreamble`). Its hash overload is a hand copy of
only the single-partial arm of actionview's `RenderOptions`
(`packages/actionview/lib/render-context.ts`): `RenderCollectionOptions` is missing, so
`render({ partial: "posts/post", collection: posts })` is checked as if `locals` had to carry the
partial's required locals (or `collection`/`as`/`spacerTemplate` are unchecked), unlike
`TseRenderContext.render`. Rails' collection arm: `actionview/lib/action_view/renderer/collection_renderer.rb`
(`as`, `<as>_counter`, `<as>_iteration` locals).

## Acceptance criteria

- The stand-in's `render` hash overload derives from actionview's `RenderOptions<P, A>` (import it,
  do not hand-copy), so the collection arm omits the auto `as` / `_counter` / `_iteration` keys.
- Pipeline regression test (`buildViews` + ts program, `paths` to source as in the render typing
  test) for a collection render of a strict-locals partial; fails on baseline.
