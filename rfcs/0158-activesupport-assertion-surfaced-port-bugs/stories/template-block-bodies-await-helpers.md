---
title: "template-block-bodies-await-helpers"
status: draft
updated: 2026-10-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`cache-store-async-consumers` made every template compile to an `async` function (`actionview/src/template.ts` `compiledSource`) and taught the TSE emitter to await top-level expressions and block-expr calls (`tse-compiler/src/emit-js.ts`, the `awaits` flag in `emit`). Two gaps remain:

- **Block bodies cannot await.** `awaits` is false inside a block-expr body (`insideBlock`) and inside any `function`/arrow body (`functionDepths`), so `<% items.forEach((i) => { %><%= render(i) %><% }) %>` and `<%= formWith(..., () => { %><%= render("p") %><% }) %>` append an unresolved promise; `OutputBuffer#<<` raises `TypeError: no implicit conversion of Promise into String` (`actionview/src/buffers.ts`). Rails evaluates the same ERB synchronously (`actionview/lib/action_view/helpers/capture_helper.rb:43-52`, `capture`).
- **Two compiled variants.** `Template#compile!` still compiles a separate `_streaming` method (`streamingMethodName`, `_compiledStreaming`), now byte-identical apart from its name, where Rails compiles one method per template (`actionview/lib/action_view/template.rb:271-290`, `compile!` at `:509-528`).

## Acceptance criteria

- Block-expr bodies run as async callbacks and their helpers (`capture`, `contentFor`, `formWith`, `tag`/`contentTag` blocks) await the block, so a nested `render` inside a block body renders.
- `Template` compiles a single method; `streamingMethodName`, `_compiledStreaming` and the `streaming` parameter of `compile` / `compiledSource` are removed, with `@missingRailsArgs` receipts on them dropped.
