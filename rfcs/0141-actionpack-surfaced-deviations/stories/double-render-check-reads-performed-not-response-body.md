---
title: "ActionController::Rendering#render raises DoubleRenderError on performed? instead of response_body"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionController::Rendering#render`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:164-167`)
is `raise ::AbstractController::DoubleRenderError if response_body; super`. It
tests the raw `response_body` reader, which is truthy for `""` and never
consults `response.committed?`.

trails raises on `this.performed` in both ports: `Base#render`
(`packages/actionpack/src/action-controller/base.ts`, inside the instrumentation
`Benchmark.realtime` block, since trails#8212) and `render` in
`packages/actionpack/src/action-controller/metal/rendering.ts`.
`performed` is `AbstractController::Base#performed?` plus the `_performed` flag,
extended by `Metal#performed` with `response.committed`
(`packages/actionpack/src/action-controller/metal.ts`). So a committed
response with no body raises where Rails does not.

What blocks the literal port: `AbstractController::Base#_responseBody` is
`protected`, and `Metal#responseBody` overrides the getter to answer `""` for
`null`, so `this.responseBody` cannot tell unset from empty. Rails'
`Metal#response_body` is a plain attr reader.

## Acceptance criteria

- Both render ports raise on the raw response body being non-nil
  (Ruby-truthy: `""` raises), not on `performed`.
- A reader that answers `null` when unset exists at the Rails name, or the
  check reads the raw slot, with no new invented surface.
- The trails test "render throws DoubleRenderError when performed is already
  set" in `metal/rendering.test.ts` is re-pointed at a `responseBody` host,
  keeping its name.
