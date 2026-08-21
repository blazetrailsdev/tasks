---
title: "Port ActiveModel::Attributes#freeze into Model's flattened freeze chain"
status: claimed
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-21T00:42:06Z"
assignee: "apply-hook-attribute-type-inside-activemodel-attribute"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Attributes#freeze`
(`vendor/rails/activemodel/lib/active_model/attributes.rb:150-153`) is:

```ruby
def freeze # :nodoc:
  @attributes = @attributes.clone.freeze unless frozen?
  super
end
```

In Rails this runs as one link of the `freeze` chain: `Validations#freeze`
(`vendor/rails/activemodel/lib/active_model/validations.rb:372-377`) touches
`errors` and `context_for_validation`, then `super` reaches
`Attributes#freeze`, which clones-and-freezes the attribute set.

`Model#freeze` in `packages/activemodel/src/model.ts` is that chain flattened —
TS has no `super` across mixins — but it only carries the `Validations` half:
it touches `errors`, calls `contextForValidation()`, and then
`Object.freeze(this)`. The `Attributes` link is missing, so a frozen trails
model still has a mutable `_attributes`: `record._attributes.writeFromUser(...)`
succeeds where Rails raises `FrozenError`.

`Attributes.prototype` in `packages/activemodel/src/attributes.ts` does not
define `freeze` at all, so there is nothing for `include(Model, Attributes)` to
contribute either.

Surfaced in review of #6796.

## Converged shape

Port `Attributes#freeze` onto `Attributes.prototype` in `attributes.ts` with
Rails' body, and have `Model#freeze` run that link where Rails' `super` reaches
it — after the `Validations` half and before `Object.freeze(this)` — the same
flattened-chain shape `Model#initializeDup` already uses for
`validationsInitializeDup` + `dirtyInitializeDup`.

`AttributeSet` needs a `clone().freeze()` path for this; check what it has
before assuming.

## Acceptance criteria

- A frozen model's attribute set is frozen: a write through `_attributes`
  raises rather than silently mutating.
- `Attributes#freeze` exists on `Attributes.prototype` with Rails' body and is
  reached from `Model#freeze` at the point Rails' `super` reaches it.
- Regression test fails on the pre-change baseline.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
