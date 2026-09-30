---
title: "base-render-returns-nil-body-and-rejects-thenables"
status: claimed
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-09-30T10:03:51Z"
assignee: "base-render-returns-nil-body-and-rejects-thenables"
blocked-by: null
closed-reason: null
---

## Context

`RenderingHelper#render`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/rendering_helper.rb:138-155`) returns
whatever `view_renderer.render` returns. That is nil for an empty or nil collection:
`render_test.rb` `test_render_partial_with_empty_collection_should_return_nil` asserts nil
through `@view.render`.

trails' `Base#render` (`packages/actionview/src/base.ts`, `renderedBody`) always wraps the
body as `htmlSafe(String(body ?? ""))`. So it can never return nil. The render_test.rb port
in trails#8236 (`packages/actionview/src/template/render.test.ts`) has to assert nil through
`view.viewRenderer.render` instead.

`Base#render` also still returns a Promise when a relation collection has to be loaded or
preloaded. That arm is async in trails (see `CollectionRenderer#renderCollectionWithPartial`'s
JSDoc). Inside a compiled synchronous template, `OutputBuffer#append` then stringifies that
Promise as `[object Promise]`. It should fail loudly instead, per
`view-render-collection-arm-returns-a-promise`'s converged shape.

## Acceptance criteria

- `Base#render` returns nil where `view_renderer.render` returns nil. The two render_test.rb
  nil tests assert through `view.render`.
- A thenable reaching a synchronous template's output buffer raises instead of being
  stringified.
