---
title: "Sanitize forbidden attributes at Model construction (ActiveModel)"
status: done
updated: 2026-07-08
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 10
pr: 4786
claim: "2026-07-08T16:51:55Z"
assignee: "model-construction-sanitize-forbidden-attributes"
blocked-by: null
closed-reason: null
---

## Context

Rails `ActiveModel::API#initialize` → `assign_attributes` runs
`sanitize_for_mass_assignment` (ForbiddenAttributesProtection) before assigning:
an unpermitted `ActionController::Parameters`-like object raises
`ForbiddenAttributesError` at construction time
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:29-37`,
`api.rb:80-82`).

trails' `Model` constructor
(`packages/activemodel/src/model.ts` — post PR #4706) calls
`this._assignAttributes(attrs)` directly, skipping `assignAttributes`'
`sanitizeForMassAssignment` step. So a bare `new Model(unpermittedParams)` does
NOT raise `ForbiddenAttributesError` the way Rails does. This is a PRE-EXISTING
gap (the old raw-`writeAttribute` constructor loop also skipped sanitization) —
NOT a regression of #4027/#4706.

Note: the ActiveRecord `Base` constructor DOES sanitize before `super()`
(`packages/activerecord/src/base.ts` — `sanitizeForMassAssignment(attrs)`), so
this gap only affects pure-activemodel `Model` construction, not AR.

Related: [[sanitize-mass-assignment-permitted-getter]],
`exists-sanitize-forbidden-attributes` (0023).

## Acceptance criteria

- [ ] `new Model(unpermittedParamsLikeObject)` raises `ForbiddenAttributesError`,
      mirroring `API#initialize` → `assign_attributes` → `sanitize_for_mass_assignment`.
- [ ] Route the `Model` constructor's assignment through the sanitizing entry
      (`assignAttributes` semantics) without double-sanitizing the AR path (AR
      already sanitizes before `super()`).
- [ ] A permitted params object still constructs; an empty bag stays a no-op
      (`return if new_attributes.empty?`).
