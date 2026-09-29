---
title: "association-helpers-extracted-for-the-collection-proxy-remainder-3"
status: ready
updated: 2026-09-29
rfc: "0123-blocked-convergence-holding"
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

`association-helpers-extracted-for-the-collection-proxy-remainder-2` folded
`inferCompositePrimaryKey` (into a line-for-line
`BelongsToAssociation#replace_keys`, `belongs_to_association.rb:131-149`),
`ownerForeignKeyColumns` (into its `reflection.foreign_key` reads) and
`buildThroughInverseFor` (into `HasManyThroughAssociation#build_record`,
`has_many_through_association.rb:90-109`). Three clusters remain, each still a
free function carrying a `@noRailsEquivalent CONVERGEABLE` receipt pointing at
this story:

- `packages/activerecord/src/associations/alias-tracker.ts` —
  `aliasedArelTableFor` / `aliasedArelTableForReflection`, two spellings of the
  `arel_table.alias(...)` inline in `TableMetadata#associated_table`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/table_metadata.rb:43`)
  and of `tracker.aliased_table_for(refl.klass.arel_table) { ... }` in
  `AssociationScope#get_chain` (`associations/association_scope.rb:112-122`).
  Callers: `association-scope.ts` `_arelTableFor`, `join-dependency.ts`
  (four sites), `join-dependency/join-association.ts:72`.
- `packages/activerecord/src/associations/has-many-association.ts` — `scope`,
  `Association#scope` (`associations/association.rb:107`) taken as an
  owner/name/options triple, reached from the module-private `findTarget`.
  Folding it removes its local `CompositePrimaryKeyMismatchError` throw: Rails'
  `Association#scope` raises nothing, and `check_validity!`
  (`reflection.rb:618-628`, from `Association#initialize`, `association.rb:42`)
  is the only raise site.
- `packages/activerecord/src/associations/through-association.ts` —
  `throughBuildRecord`, `ThroughAssociation#build_record`
  (`associations/through_association.rb:116-129`). It cannot simply become a
  `buildRecord` member of the `ThroughAssociation` object today: both
  `has-many-through-association.ts` and `has-one-through-association.ts` mix it
  in with `Object.assign(Klass.prototype, { ...ThroughAssociation })`, which
  overwrites the class's own `buildRecord` instead of splicing the module
  between the class and its superclass as Ruby's `include` does. Moving the
  mixin onto `include()` (so HMT#build_record's `super` reaches
  ThroughAssociation#build_record, whose `super` reaches
  CollectionAssociation) is the prerequisite.

## Acceptance criteria

- Each helper above is folded into the Rails method that owns its body, and
  its receipt is deleted with it.
- `ThroughAssociation` is mixed in with `include()` so `build_record`'s
  `super` chain matches Rails.
- Split across as many PRs as the LOC ceiling needs; one file per PR is a
  natural cut.
