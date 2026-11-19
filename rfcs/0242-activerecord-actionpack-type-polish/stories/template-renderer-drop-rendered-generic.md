---
title: "TemplateRenderer#renderTemplate returns RenderedTemplate; drop the Rendered generic"
status: ready
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
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

`TemplateRenderer` is declared `TemplateRenderer<Rendered = Promise<RenderedTemplate>>`
(`packages/actionview/lib/renderer/template-renderer.ts:18`), and
`renderTemplate` returns `Rendered` (`:101-121`, ending `as Rendered`).
`StreamingTemplateRenderer` extends it with
`Promise<Body | (string | SafeBuffer | Uint8Array | null)[]>`
(`renderer/streaming-template-renderer.ts:50-52`), so inside the override
`super.renderTemplate(...)` is typed as the streaming result. At run time it is
a `RenderedTemplate`, so the override needs
`(rendered as unknown as RenderedTemplate).body` (`:62`).

In Rails, `TemplateRenderer#render_template` returns a `RenderedTemplate`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/template_renderer.rb:58-70`,
`build_rendered_template`). `StreamingTemplateRenderer#render_template`
(`renderer/streaming_template_renderer.rb:44-60`) returns `[super.body]` or a
`Body`. The two methods return different types and have no shared type
parameter.

## Acceptance criteria

- [ ] `TemplateRenderer#renderTemplate` returns `Promise<RenderedTemplate>`, and the
      `Rendered` type parameter is removed.
- [ ] The streaming override declares its own return type, using the repo's
      settled override shape (CLAUDE.md § "Override arity" / "Override signature on
      the static side") if TypeScript rejects the wider return.
- [ ] `streaming-template-renderer.ts:62` reads `(await super.renderTemplate(...)).body`
      with no cast.
