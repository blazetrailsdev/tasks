---
title: "Un-skip render_plain_test.rb's two MinimalController tests now Rendering is includable"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
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

`packages/actionpack/src/action-controller/controller/new-base/render-plain.test.ts:82-83,186-187` parks two ports as empty `it.skip` bodies under `BLOCKED: action-controller-rendering-is-not-an-includable-module`:

- "rendering text from a minimal controller"
- "rendering from minimal controller returns response with text/plain content type"

Both exercise `RenderPlain::MinimalController < ActionController::Metal`, which includes `AbstractController::Rendering` and `ActionController::Rendering` (`vendor/rails/v8.0.2/actionpack/test/controller/new_base/render_plain_test.rb`).

trails#8557 made `ActionController::Rendering` an includable `Module` (`packages/actionpack/src/action-controller/metal/rendering.ts`) and `ActionView::Rendering` / `ActionView::ViewPaths` modules a bare `Metal` can include, and `controller/render.test.ts`'s `ActionControllerRenderTest` and `MetalRenderTest` already run through them. The blocker these two tests cite is gone for a Metal includer.

## Acceptance criteria

- [ ] Both tests carry the Rails bodies, with `MinimalController` declared as Rails declares it, and run.
- [ ] The two `BLOCKED:` lines are removed. Once no code cites `action-controller-rendering-is-not-an-includable-module`, close that story; its remaining work (one body per Rails method, `ClassMethods`) is `rendering-module-keeps-duplicate-free-functions-and-no-class-methods`.
