---
title: "ActionController render_to_string is untyped where render is typed"
status: draft
updated: 2026-10-01
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

PR trails#8315 typed `ActionController::Base#render` (`packages/actionpack/src/action-controller/base.ts`, `RenderArgs<P>` / `RenderOptions`). `render_to_string` takes the same argument list in Rails — `ActionController::Rendering#render_to_string(*)` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:172-184`) calls `AbstractController::Rendering#render_to_string(*args, &block)` (`abstract_controller/rendering.rb:44-47`), which normalizes through the same `_normalize_render`.

trails still types it `(...args: unknown[]): unknown` (`packages/actionpack/src/action-controller/metal/rendering.ts:127`, declared on `Base` at `base.ts:771`), so `this.renderToString({ acton: "new" })` or a wrong `status` compiles.

## Converged shape

`renderToString` takes the same `RenderArgs<P>` tuple `render` takes, so a misspelled option key, a non-Rack `status` and a registered partial's wrong `locals` are type errors. The return type names what the body returns (a string, or a promise of one on the async path) instead of `unknown`.

## Acceptance criteria

- [ ] `this.renderToString({ action: "new", status: "unprocessable_entity" })` type-checks, and a misspelled option key or wrong `status` is a type error.
- [ ] Type tests beside the `render` ones in `packages/actionpack/src/action-controller/metal/rendering.trails.test.ts`.
