---
title: "ThroughAssociation bodies re-look-up the reflection and add guards through_association.rb does not have"
status: draft
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8282 made `ThroughAssociation` a live ruby-compat `Module`
(`packages/activerecord/src/associations/through-association.ts`) that is
`include()`d into HasManyThrough / HasOneThrough, and ported `build_record`
line-for-line. The pre-existing bodies around it still diverge from
`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/through_association.rb`:

- `delegate :source_reflection, to: :reflection` (`:7`): trails instead defines
  `sourceReflection` separately in each class body (`has-many-through-association.ts`,
  `has-one-through-association.ts`), plus an exported free function `sourceReflection(assoc)`
  that re-looks-up the reflection via `owner.constructor._reflectOnAssociation(name)`.
- `through_reflection` (`:14-24`) is `@through_reflection ||= begin refl = reflection.through_reflection;
while refl.through_reflection? ...`. trails re-resolves through `_reflectOnAssociation`
  and falls back to `reflection.options.through`, with no memo.
- `through_association` (`:26-28`) is `@through_association ||= owner.association(through_reflection.name)`.
  trails has no memo, and guards with `?.` and an early `return null`.
- `target_scope` (`:34-43`) is `scope = super; chain.drop(1).each { scope.merge!(relation.except(...)) }`.
  trails adds `if (!scope) return scope`, `typeof except === "function"` and
  `typeof merge === "function"` guards, uses `merge` (not `merge!`), and reads the
  chain off a re-looked-up reflection instead of `reflection.chain`.
- `construct_join_attributes` (`:57-77`), `ensure_mutable` (`:94-102`) and
  `ensure_not_nested` (`:104-112`) re-look-up the reflection via `_reflectOnAssociation`
  and carry `?.` / `?? macro ===` fallbacks. `ensure_mutable` passes `(ownerName, reflection.name)`
  where Rails passes `(owner, reflection)`.

(`stale_state` is covered by `port-through-association-stale-state` /
`through-association-stale-state-array-shape`. `transaction` is covered by
`delete-dead-through-association-transaction`.)

## Converged shape

Each method reads `this.reflection` directly, as Rails does. `source_reflection`
delegates to the reflection. `through_reflection` / `through_association` memoize
(`??=`). `target_scope` is `super` + `merge!` over `reflection.chain.drop(1)` with no
guards. The error constructors receive `(owner, reflection)`.

## Acceptance criteria

- The listed bodies match `through_association.rb` line-for-line. The per-class
  `sourceReflection` definitions and the exported `sourceReflection` free function are removed.
- `pnpm parity:api:calls` / `parity:api:calls:args` stay green. The HMT, HOT and nested-through
  test files stay green.
