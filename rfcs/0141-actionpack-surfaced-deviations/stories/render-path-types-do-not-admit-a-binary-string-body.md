---
title: "ActionView render-path types narrow a binary String body to string | SafeBuffer"
status: draft
updated: 2026-10-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template::Text#initialize`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/text.rb:10`) is
`@string = string.to_s`, and `to_str` / `render` (`:18-24`) answer that String,
binary or not. Since trails#8610 `packages/actionview/src/template/text.ts`
holds `string | Uint8Array` (a `Uint8Array` is the binary String seat, see
ruby-compat's `rbObjAsString`), so `render body: <binary>` reaches the response
byte-exact.

The types downstream of `Text#render` were not widened with it.
`RenderableTemplate#render` (`packages/actionview/src/renderer/abstract-renderer.ts`)
admits `Uint8Array`, but `RenderedTemplate#body`, `TemplateRenderer#renderWithLayout`'s
`body` local and block type (`renderer/template-renderer.ts`),
`_renderTemplate` (`rendering.ts`) and `Renderer#render` (`renderer/renderer.ts`)
are all typed `string | SafeBuffer`, and
`renderer/streaming-template-renderer.ts` casts
`content as string | SafeBuffer` at `view.viewFlow.set("layout", content)`.
A binary body flows through all of them at run time behind those types.

## Acceptance criteria

- [ ] `RenderedTemplate#body` and the render-path types between `Text#render`
      and `AbstractController::Rendering#render`'s `responseBody =` admit
      `Uint8Array`, with no cast narrowing it away.
- [ ] The `content as string | SafeBuffer` cast in
      `streaming-template-renderer.ts` is gone.
- [ ] `pnpm typecheck` is green and no runtime behaviour changes.
