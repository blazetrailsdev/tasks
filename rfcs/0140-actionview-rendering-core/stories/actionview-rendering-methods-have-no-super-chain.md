---
title: "actionview-rendering-methods-have-no-super-chain"
status: draft
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Base` includes `AbstractController::Rendering` and then
`ActionView::Layouts`, which includes `ActionView::Rendering`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb:222-266`). So
`ActionView::Rendering#_process_format`'s `super`
(`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:146-149`) reaches
`AbstractController::Rendering#_process_format`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/rendering.rb:97-98`).

In trails, actionview's rendering methods are `this`-typed module functions
that `packages/actionpack/src/action-controller/base.ts` assigns straight onto
`Base.prototype` (`_processFormat`, `_renderTemplate`,
`_processRenderTemplateOptions`, …). No ancestry sits between them and the
abstract ones in `packages/actionpack/src/abstract-controller/rendering.ts`. So
`_processFormat` (`packages/actionview/src/rendering.ts`, ported in trails#8194)
cannot call `super`, and actionview cannot import actionpack to call it
directly, because actionpack depends on actionview. A `@missingRailsCall super`
receipt reds `parity:api:calls` as STALE, because the comparer does not flag
this `super`. The same holds for every ActionView::Rendering method whose Rails
body calls `super` (`_normalize_args`, `process`, `initialize`).

## Acceptance criteria

- `AbstractController::Rendering` and `ActionView::Rendering` reach
  `ActionController::Base` as included modules (`include()` / `Included<>`),
  in Rails' order, not as prototype assignments.
- `ActionView::Rendering#_process_format` calls `super` into
  `AbstractController::Rendering#_process_format`, as `rendering.rb:147` does.
