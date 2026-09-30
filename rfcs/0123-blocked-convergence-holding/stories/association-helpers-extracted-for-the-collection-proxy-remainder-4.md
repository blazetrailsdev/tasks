---
title: "association-helpers-extracted-for-the-collection-proxy-remainder-4"
status: draft
updated: 2026-09-30
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

`association-helpers-extracted-for-the-collection-proxy-remainder-3` folded
`throughBuildRecord` into `ThroughAssociation#build_record`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/through_association.rb:116-129`),
moving `ThroughAssociation` onto a live `Module` spliced with `include()`. Two clusters
remain, each a free function carrying a `@noRailsEquivalent CONVERGEABLE` receipt that
must be re-pointed at this story:

- `packages/activerecord/src/associations/alias-tracker.ts` — `aliasedArelTableFor` /
  `aliasedArelTableForReflection`, two spellings of `reflection.klass.arel_table` fed to
  `alias_tracker.aliased_table_for(...)` in `JoinDependency#make_constraints`
  (`associations/join_dependency.rb:190-212`, `:204`) and of the `arel_table.alias(...)` in
  `TableMetadata#associated_table` (`table_metadata.rb:43`). Callers:
  `join-dependency.ts` `addAssociation` (Rails `build`, `join_dependency.rb:228-240`, which
  builds `JoinAssociation.new(reflection, children)` with no table), `makeConstraints`
  (three sites; Rails reads `parent.table` directly and passes
  `reflection.klass.arel_table` to `aliased_table_for`), and
  `join-dependency/join-association.ts:72` (Rails' `join_constraints`,
  `join_association.rb:24-39`, always yields to the block; there is no fallback arm).
  `makeConstraints` also carries an `effectiveName` / `resolvedRoot` layer and a
  `_joinedTables` memo keyed by `reflectionChainKey` where Rails keys
  `@joined_tables[remaining_reflection_chain]` by the chain itself.
- `packages/activerecord/src/associations/has-many-association.ts` — `scope`
  (receipt at ~:378), `Association#scope` (`associations/association.rb:107`) taken as an
  owner/name/options triple and reached from the module-private `findTarget`. Rails'
  HasManyAssociation defines no `find_target`; `CollectionAssociation#find_target`
  (`collection_association.rb`) and `Association#find_target` (`association.rb`) own it.
  Folding it removes the local `CompositePrimaryKeyMismatchError` throw: Rails'
  `Association#scope` raises nothing, and `check_validity!` (`reflection.rb:618-628`, from
  `Association#initialize`, `association.rb:42`) is the only raise site.

## Acceptance criteria

- Each helper above is folded into the Rails method that owns its body, and its receipt
  is deleted with it.
- One file per PR is a natural cut; split as the LOC ceiling needs.
