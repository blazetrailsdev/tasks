---
title: "trim-active-model-model-to-api-and-access"
status: done
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7160
claim: "2026-08-28T13:55:21Z"
assignee: "seed-ar-attributes-before-init-internals"
blocked-by: null
closed-reason: null
---

## Context

Final slice of `split-model-mixin-surface-to-active-model-model`, landing after
the serialization and attributes slices.

What is left in `packages/activemodel/src/model.ts` at that point:

- `include(Model, ...)` for `Validations::Callbacks` (`beforeValidation`,
  `afterValidation`) and `defineModelCallbacks` — `api.rb:60-65` includes
  `Validations`, not `Validations::Callbacks`, so these are still `moved`.
- the residual type-only `declare` / `interface Model` members that existed only
  to type the runtime `include()` calls the earlier slices removed.

## Acceptance criteria

- `pnpm parity:api:extra --package activemodel` reports `model.ts` at
  **0 novel / 0 moved**.
- `model.ts` is <= 200 code lines and reads as the port of `model.rb` + `api.rb`
  - `access.rb`, and nothing else.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; parity deltas non-negative.
