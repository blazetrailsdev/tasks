---
title: "ActionController render args type admits plain-object, assigns, hashlike locals and model shapes"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9199
claim: "2026-10-21T22:29:25Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

## Context

`action-controller-render-is-untyped` (trails#8315) typed
`ActionController::Base#render` with `RenderArgs<P>` / `RenderOptionsFor<P>`
(`packages/actionpack/src/action-controller/base.ts:252-261`). The type rejects
four argument shapes that Rails' `render` accepts. Each one is used by a ported
`render_test.rb` controller action in
`packages/actionview/src/actionpack/controller/render.test.ts` behind an
`as unknown as` cast with a `BLOCKED:` line naming this story:

- `render plain: Customer.new("David")`: `plain:` takes any object and
  `to_s`es it (`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb`, `render_text_with_resource`).
- `render inline: ..., assigns: { hello: "world" }` (`render_with_assigns_option`).
- `render partial: "customer", locals: ActionController::Parameters.new(...)`:
  hash-like locals (`partial_with_hashlike_locals`).
- `render Quiz::Question.new("first")`: a model as the sole argument
  (`partial_with_nested_object_shorthand`).

Removing the casts reds `pnpm typecheck` with TS2345 / TS2353 at those four sites.

## Acceptance criteria

- `RenderArgs` / `RenderOptionsFor` admit the four shapes above. Do not widen
  them to `unknown`.
- The four casts and their `BLOCKED:` lines are gone from `render.test.ts`, and
  `pnpm typecheck` is green.
