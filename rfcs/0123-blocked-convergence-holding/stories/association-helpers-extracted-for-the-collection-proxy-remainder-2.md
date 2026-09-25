---
title: "Fold the remaining extracted association helpers into their Rails methods"
status: draft
updated: 2026-09-25
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`association-helpers-extracted-for-the-collection-proxy-remainder` converged
`HasManyAssociation#difference` / `#intersection`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_association.rb:158-164`)
by inlining the extracted `setDifference` / `setIntersection` into the two
methods. The rest of the cluster is still extracted free functions, each
carrying a `@noRailsEquivalent CONVERGEABLE` receipt pointing at this story.
Rails reaches each body off a real `Association` / reflection object:

- `packages/activerecord/src/associations/alias-tracker.ts` —
  `aliasedArelTableFor` / `aliasedArelTableForReflection`, two spellings of the
  `arel_table.alias(...)` inline in `TableMetadata#associated_table`
  (`table_metadata.rb:43`).
- `packages/activerecord/src/associations/belongs-to-association.ts` —
  `inferCompositePrimaryKey`, the composite-PK branch of
  `BelongsToReflection#association_primary_key` (`reflection.rb:926-938`),
  called from `BelongsToAssociation` and three times from
  `belongs-to-polymorphic-association.ts:69-74`.
- `packages/activerecord/src/associations/foreign-association.ts` —
  `ownerForeignKeyColumns`, the extracted `reflection.foreign_key` read.
- `packages/activerecord/src/associations/has-many-association.ts` — `scope`,
  `Association#scope` (`association.rb:107`) taken as an owner/name/options
  triple.
- `packages/activerecord/src/associations/has-many-through-association.ts` —
  `buildThroughInverseFor`, the inverse half of `#build_record`
  (`has_many_through_association.rb:90-109`).
- `packages/activerecord/src/associations/through-association.ts` —
  `throughBuildRecord`, the pre-super seeding half of `#build_record`
  (`through_association.rb:116-129`).

## Acceptance criteria

- Each helper above is folded into the Rails method on the association /
  reflection object that owns its body, and its receipt is deleted with it.
- Folding `scope` removes its local `CompositePrimaryKeyMismatchError`
  construction and throw (the one left after trails#8074 cleared
  `association-scope.ts`). Rails' `Association#scope` (`association.rb:107`)
  raises nothing, and `check_validity!` (`reflection.rb:618-628`, called from
  `Association#initialize`, `association.rb:42`) is the only raise site.
- Split across as many PRs as the LOC ceiling needs; one file per PR is a
  natural cut.
- `pnpm parity:api:extra --package activerecord` total strictly drops.
