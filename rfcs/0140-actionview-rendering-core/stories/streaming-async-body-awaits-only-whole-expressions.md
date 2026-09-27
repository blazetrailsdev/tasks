---
title: "Async TSE render awaits only whole top-level expressions, so a nested yield read does not suspend the layout"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8167 gave streaming renders an async compiled body. `compileJs(..., { async: true })`
(`packages/tse-compiler/src/emit-js.ts`, `emit` / `emitNode`) wraps only a top-level `<%= %>` /
`<%== %>` tag's WHOLE expression in `await (...)`. A `yield` / `_layoutFor` / `contentFor` read
nested inside a larger expression is therefore not awaited when the layout suspends on it:
`<%= _layoutFor("unknown") || "." %>` becomes `await (promise || ".")`, so it yields `""` where Rails
yields `"."`.

Rails' fixture `vendor/rails/v8.0.2/actionview/test/fixtures/layouts/streaming.erb:4`
(`<%= yield(:unknown).presence || "." -%>`) depends on exactly this. In Rails, `StreamingFlow#get`
(`vendor/rails/v8.0.2/actionview/lib/action_view/flows.rb:43-58`) runs `Fiber.yield` at the read
site, whatever expression surrounds it.

The same pass also skips any expression inside a function literal or a blockExpr capture
(`functionDepths` / `innerDepths`). It also miscounts braces that sit inside a regex literal in a
code tag. The pre-existing `netBraceDepth` blockExpr-closer pass has the same regex-literal gap.

## Converged shape

The async body awaits every flow read, at the read itself. Whether that means emitting `await`
before each call to `yield` / `_layoutFor` / `contentFor` / `isContentFor` in the async variant,
or parsing code tags as JS rather than counting braces, is the implementer's call. A read
surrounded by `||`, `.presence`, or any other expression then behaves as it does in Rails.

## Acceptance criteria

- `<%= _layoutFor("unknown") || "." %>` in a streaming layout renders `"."` once the content turns
  out absent.
- Braces inside regex literals in code tags do not desync the await / blockExpr tracking.
