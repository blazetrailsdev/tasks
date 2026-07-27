---
title: "through-find-target-becomes-instance-method"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

PR #5364 (story `extra-surface-relocate-load-through`) moved the two
through-association target loads out of the `associations.ts` engine into
their Rails-layout files and renamed them to `findTarget`:

- `packages/activerecord/src/associations/has-many-through-association.ts`
  (Rails `HasManyThroughAssociation#find_target`,
  `vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:225`)
- `packages/activerecord/src/associations/has-one-through-association.ts`
  (Rails `find_target` inherited from `SingularAssociation`)

That clears the `api:compare` extra, but a fidelity gap remains: in Rails
`find_target` is a **private instance method** on the association object,
reading `owner` / `reflection` / `scope` off `this`. In trails it is still a
module-level function with the engine signature
`(record: Base, assocName: string, options: AssociationOptions)`, called from
the `loadHasOne` / `loadHasMany` dispatch arms in `associations.ts`
(`return findHasOneThroughTarget(...)` / `return findHasManyThroughTarget(...)`).

Converting it to a real method requires the callers to hold an association
instance rather than `(record, assocName, options)`, which is why it was left
out of the relocation PR.

## Acceptance criteria

- `findTarget` becomes a (protected/private) instance method on
  `HasManyThroughAssociation` and `HasOneThroughAssociation`, reading owner
  and reflection off `this` rather than taking them as parameters.
- The `associations.ts` dispatch arms obtain the association instance and call
  the method; the module-level function exports are gone.
- `pnpm api:compare && pnpm api:extra --package activerecord --novel-only`
  shows no new novel entries in either file.
- Through-association tests pass with no test renames.
