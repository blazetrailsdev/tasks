---
title: "trim-active-model-model-to-api-and-access"
status: blocked
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-26T23:54:56Z"
assignee: "trim-active-model-model-to-api-and-access"
blocked-by: "Blocker refreshed 2026-08-27. The previously named dep move-attribute-mixins-off-active-model-model HAS LANDED (done, PR #7113) — but it shipped only the ActiveModel::Dirty slice. The remainder is now move-attributes-and-attribute-methods-off-active-model-model (this RFC, flipped ready 2026-08-27, priority 3), which still has to remove Attributes / AttributeRegistration / AttributeMethods from Model. Verified against origin/main: model.ts is down to 613 lines (was 814) and the serialization and Dirty includes are gone, but :546 still does extend(Model, {decorateAttributes, attributeTypes, typeForAttribute, _defaultAttributes, pendingAttributeModifications, resetDefaultAttributesBang, resolveTypeName, hookAttributeType}), :561 extend(Model, AttributeMethods.ClassMethods), :564 include(Model, AttributeMethods.InstanceMethods), :569-573 the Attributes block. Those own the remaining moved names, so 0 moved and the <=200-line target stay unreachable. The CLI has no set-deps verb, so the ordering is carried by priority (group-model-ts-remaining-inline-mixin-literals p2 -> move-attributes-and-attribute-methods p3 -> this)."
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
