---
title: "tse-block-expr-drops-inserted-capture-wrapper"
status: in-progress
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8177
claim: "2026-09-27T02:27:48Z"
assignee: "port-the-rest-of-asset-tag-helper-and-asset-url-helper"
blocked-by: null
closed-reason: null
---

## Context

Erubi's ActionView `add_expression` emits a block expression as `@output_buffer.append= <code>` and
nothing more (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb/erubi.rb:47-61`).
The block body appends to `@output_buffer`, and each block-taking helper captures it itself:
`content_tag` is `content_tag_string(name, capture(&block), ...)`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb:516-521`), and
`TagBuilder#tag_string` is `@view_context.capture(self, &block)` (`tag_helper.rb:230`).

trails' tse emitter (`packages/tse-compiler/src/emit-js.ts`, the `blockExpr` branch of `emit()`)
still adds `return context.capture(() => {` inside the user's arrow block, plus the matching
`});` on the closer (trails#8169 made the tag code itself verbatim). The wrapper is needed only
because trails' helpers call the block bare. `contentTag` does `contentTagString(name, block(), ...)`
and the tag builder's self-closing/content arms do `block(receiver)`
(`packages/actionview/src/helpers/tag-helper.ts`).

## Acceptance criteria

- `contentTag` and the TagBuilder arms capture the block as `tag_helper.rb:230,521` do.
- The emitter drops its inserted `context.capture` wrapper and its `});` closer, emitting
  `append(<code>` for the opener and `<code>)` for the closer.
- Block-expression templates still render their bodies once, into the helper's output.
