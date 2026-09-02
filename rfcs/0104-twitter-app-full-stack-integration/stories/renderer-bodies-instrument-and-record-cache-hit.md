---
title: "PartialRenderer/CollectionRenderer instrument their bodies and record cache_hit"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails instruments both renderer bodies and records the collection cache hit on
the payload:

- `PartialRenderer#render_partial_template`
  (`vendor/rails/actionview/lib/action_view/renderer/partial_renderer.rb:245-260`)
  wraps its body in
  `ActiveSupport::Notifications.instrument("render_partial.action_view",
identifier:, layout:, locals:)` and sets
  `payload[:cache_hit] = view.view_renderer.cache_hits[template.virtual_path]`
  (`:257`).
- `CollectionRenderer#render_collection`
  (`collection_renderer.rb:153-176`) wraps its body in
  `"render_collection.action_view"` with `identifier:`, `layout:` and `count:`,
  and hands the payload to `cache_collection_render` (`:170`).

`packages/actionview/src/renderer/partial-renderer.ts`'s
`renderPartialTemplate` and `collection-renderer.ts` port the bodies without
either notification, so no `cache_hit` is ever recorded and
`ViewContext#viewRenderer.cacheHits` — declared in
`abstract-renderer.ts` precisely for this — has no writer.

`actionview-instrumentation` (RFC 0104) covers the same gap in `template.ts`
(`instrument_render_template` / `instrument`) and is scoped to that file; this
is the renderer half. Surfaced in PR #7373.

## Converged shape

Both bodies run inside the ActiveSupport notification Rails names, with Rails'
payload keys, and `render_partial_template` sets `payload[:cache_hit]` from
`view.view_renderer.cache_hits[template.virtual_path]`.

## Acceptance criteria

- `render_partial_template` instruments `render_partial.action_view` with
  `identifier`, `layout` and `locals`, and sets `cache_hit` on the payload.
- `render_collection` instruments `render_collection.action_view` with
  `identifier`, `layout` and `count`.
- `parity:api:calls` loses the corresponding rows rather than gaining any.
