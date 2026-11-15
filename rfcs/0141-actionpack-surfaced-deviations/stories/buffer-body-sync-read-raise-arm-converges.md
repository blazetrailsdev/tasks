---
title: "Buffer#body's raise-while-streaming arm converges or is ratified"
status: draft
updated: 2026-11-15
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10146 made `render(stream: true)` hand `ActionView::StreamingTemplateRenderer::Body` to the response, as `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal.rb:234-242` does. Rails' `ActionDispatch::Response::Buffer#body` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb`) is a plain `each`-and-concatenate. Its `each` blocks in Ruby, so it is always complete.

In trails, `Buffer#body` (`packages/actionpack/lib/action-dispatch/http/response.ts`, the `get body()` on `Buffer`) has an invented arm. When `this.each(...)` returns a Promise (a streamed Body), it stores `{ each, buf }` in `_pendingBody` and raises `RuntimeError("streaming ActionDispatch::Response body: await awaitBody before body")`. `awaitBody` then awaits the stored iteration. This follows the `FileList#to_ary` precedent in the root CLAUDE.md, but no ratified section covers `Buffer#body`.

## Acceptance criteria

- Either the raise arm and `_pendingBody` are removed because every in-repo sync reader of a streamed response awaits first (the integration session already does, in `Session#process`), or the operator ratifies the arm in `packages/actionpack/CLAUDE.md` beside § "a response body is iterated async (`Response#each`)", with a receipt at the arm.
- The tests in `packages/actionpack/test/action-controller/base.trails.test.ts` under "ActionController::Streaming chunked response body" still pass.
