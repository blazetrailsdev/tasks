---
title: 'Renderer format seats invent a ?? ":html" fallback Rails does not have'
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' renderers read `formats.first` with no default:
`Template::HTML.new(options[:html], formats.first)`
(`vendor/rails/actionview/lib/action_view/renderer/template_renderer.rb:24`),
`find_layout(path, locals.keys, [formats.first])` (`:72`), and
`streaming_template_renderer.rb:48`. `formats` is never empty there because
`LookupContext#formats` defaults through `register_detail(:formats)`.

trails invents an `?? ":html"` fallback at each seat:
`packages/actionview/src/renderer/template-renderer.ts` (html arm, layout
lookup, `findTemplateForName`), `renderer/partial-renderer.ts` (MissingTemplate
details), `renderer/streaming-template-renderer.ts` (layout lookup),
`lookup-context.ts`'s `render`, and `base.ts`'s `currentFormat`. trails#8129
only re-spelled them.

## Converged shape

Each seat reads `formats[0]` as Rails reads `formats.first`, with no
fallback; any seat that can genuinely see an empty `formats` is traced to the
detail default that should have filled it.

## Acceptance criteria

- No `?? ":html"` fallback remains in the actionview renderer seats listed.
- actionview suite green.
