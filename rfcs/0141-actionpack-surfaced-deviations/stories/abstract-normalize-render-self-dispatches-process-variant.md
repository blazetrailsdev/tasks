---
title: "AbstractController::Rendering#_normalize_render self-dispatches _process_variant"
status: in-progress
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8203
claim: "2026-09-27T23:57:35Z"
assignee: "abstract-normalize-render-self-dispatches-process-variant"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AbstractController::Rendering#_normalize_render`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/rendering.rb:114-119`) calls
`_process_variant(options)` as a self-send. The abstract no-op (`:101-102`) is overridden by
`ActionController::Rendering#_process_variant`, which copies `request.variant` into
`options[:variant]`.

trails' `_normalizeRender` (`packages/actionpack/src/abstract-controller/rendering.ts`) calls the
module-local no-op `_processVariant(options)` directly. So even once the controller routes through
it, the `ActionController::Rendering` override (`action-controller/metal/rendering.ts`
`_processVariant`) never runs. `metal.ts` also carries a misplaced `static _processVariant = ...`.
trails#8177 worked around this: `ActionController::Base#render` calls `this._processVariant(options)`
itself, because its render bypasses `_normalize_render`.

## Converged shape

- `_normalizeRender` becomes `this`-typed and calls `this._processVariant(options)`, `this._normalizeArgs`
  and `this._normalizeOptions` as self-sends, as `rendering.rb:114-119` does.
- The `static _processVariant` on `Metal` is removed. `Base#render`'s direct `_processVariant` call is
  dropped once `controller-render-converges-onto-abstract-controller-render` routes render through
  `_normalize_render`.

## Acceptance criteria

- `_normalizeRender` dispatches `_process_variant` through the receiver.
- `respond-to.test.ts`'s "variant with implicit template rendering" stays green without
  `Base#render` calling `_processVariant` itself.
