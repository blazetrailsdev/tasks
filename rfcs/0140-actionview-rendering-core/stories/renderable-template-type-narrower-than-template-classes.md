---
title: "RenderableTemplate's format/render types are narrower than Template::HTML/Renderable, forcing casts"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8156 made `determineTemplate`
(`packages/actionview/src/renderer/template-renderer.ts`) return the ported
`Template::Text` / `Template::HTML` / `Template::Renderable`, as
`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/template_renderer.rb:17-44` does.
`HTML` and `Renderable` still need `as unknown as RenderableTemplate` casts, because
`RenderableTemplate` (`renderer/abstract-renderer.ts`) is narrower than the real classes:

- `format` is typed `string | null`, but `HTML#format` returns the stored type (`html.rb`,
  `attr_reader :type`) and `Renderable#format` returns `@renderable.try(:format)`.
- `render` must return `string`, but `HTML#render` returns an html-safe `SafeBuffer`
  (`html.rb` `to_s` → `ERB::Util.h`).

- `RenderedTemplate#body` is typed `string`, yet a SafeBuffer now flows into it on the
  `html:` arm.

## Converged shape

Widen `RenderableTemplate` (and `RenderedTemplate#body`) to what Rails' duck type returns:

- `format: unknown`
- `render(...): string | SafeBuffer | Promise<…>`

That lets `Text`, `HTML`, `Renderable`, `RawFile`, `Inline` and `Template` satisfy it with no
casts. `render()`'s `prependFormats(template.format)` then mirrors
`template_renderer.rb:9`.

## Acceptance criteria

- `determineTemplate` has no `as unknown as RenderableTemplate` cast.
- `RenderedTemplate#body` admits a `SafeBuffer`, and its consumers stringify where Rails
  calls `to_s`.
