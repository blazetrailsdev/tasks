---
title: "RenderingHelper#render dispatches through view_renderer, not renderPartialSync + currentFormat"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionView::Helpers::RenderingHelper#render`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/rendering_helper.rb:138-155`) dispatches
everything through the view renderer:

- a Hash with a block goes to `view_renderer.render_partial(self, options.merge(partial: options[:layout]), &block)`,

- a Hash without one goes to `view_renderer.render(self, options)`,

- a `render_in` object goes to `options.render_in(self, &block)`,

- anything else goes to `view_renderer.render_partial(self, partial: options, locals: locals, &block)`.

The format is never passed explicitly. The partial renderer reads `lookup_context.formats`, which
`TemplateRenderer#render_template` has already prepended with `template.format`
(`renderer/template_renderer.rb:9`).

trails' `Base#render` (`packages/actionview/src/base.ts`) instead calls
`LookupContext#renderPartialSync` / `renderTemplateSync` (both `@noRailsEquivalent`). It passes a
`viewFormat` computed by the invented private `currentFormat()`
(`currentTemplate?.format ?? lookupContext.formats[0]`, per trails#8158). It also computes its own
prefix with the invented `virtualPathPrefix()`.

## Converged shape

`Base#render` mirrors `rendering_helper.rb:138-155` branch for branch, calling
`viewRenderer.renderPartial` / `viewRenderer.render`. `currentFormat`, `virtualPathPrefix` and the
`LookupContext#render*Sync` entry points are deleted.

## Acceptance criteria

- `Base#render` has Rails' four arms, in Rails' order, with no explicit format argument.

- `currentFormat` and `virtualPathPrefix` are gone from `base.ts`.

- The actionview suite is green.
