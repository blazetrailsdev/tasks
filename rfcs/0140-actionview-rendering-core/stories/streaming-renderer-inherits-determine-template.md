---
title: "StreamingTemplateRenderer inherits render/determine_template instead of its own lookup"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `StreamingTemplateRenderer < TemplateRenderer`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/streaming_template_renderer.rb:9`)
overrides only `render_template` (`:44-53`); `render` / `determine_template` /
`prepend_formats` are inherited from `template_renderer.rb:5-12,15-45`. PR #8136 made
trails' class extend `TemplateRenderer`, but `renderStream`
(`renderer/streaming-template-renderer.ts`) still re-implements template lookup with its
own `findAll` / `findTemplate` and a bespoke `Missing template:` `Error`, and `render`
throws `"Use renderStream() for streaming rendering."`.

## Converged shape

`renderStream` goes through the inherited `determineTemplate` (so `MissingTemplate`,
`:body`/`:plain`/`:html`/`:inline` arms match `template_renderer.rb:15-45`), and the
streaming entry point is the Rails `render` → `render_template` override, returning a
`Body` whose `each` drives `delayed_render`.

## Acceptance criteria

- No template-lookup code of its own in `streaming-template-renderer.ts`.
- Missing template raises `MissingTemplate`, as in Rails.
- The `render` throw is gone; `render` is the inherited one.
