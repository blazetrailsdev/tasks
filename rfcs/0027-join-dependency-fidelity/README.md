---
rfc: "0027-join-dependency-fidelity"
title: "JoinDependency fidelity — converge internal state model to Rails' build-once walk/construct shape"
status: active
created: 2026-06-12
updated: 2026-06-12
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - join-dependency
related-rfcs:
  - "0022-relation-arel-ast-convergence"
---

# RFC 0027 — JoinDependency fidelity

## Summary

`associations/join-dependency.ts` is 1,160 code lines vs Rails'
`join_dependency.rb` at 246 (**4.7×**) — the largest structural deviation in
the associations layer. The gap is not missing activesupport helpers (Rails'
file leans only on plain `Enumerable`, which JS covers natively); it is that
the TS `JoinDependency` carries mutable bookkeeping state and methods with
**no Rails counterpart**: `_treeNodesByPath`, `_snapshotTree`/`_restoreTree`,
`_arelTablesByIndex`, `setReferences`/`rebindTableReferences`, and the
`addAssociationSpec`/`_walkSpec`/`eagerSpecToTree` spec-validation layer.
Rails builds the join tree once per query via `make_tree`/`walk_tree` and
tracks aliases purely through `AliasTracker` + `Aliases`. This RFC converges
the TS internal state model to that shape, story by story, behavior-preserving.

## Motivation

The snapshot/restore + path-keyed mutation model means every join-related
Rails fix has to be re-derived against a different architecture instead of
ported line-for-line, and bugs in the bookkeeping (alias collisions, stale
rebinding) have no Rails analogue to compare against. Recent sibling-alias
work (#3145) had to thread through this machinery. The `join-dependency/`
submodule files (`join-part`, `join-base`, `join-association`) already mirror
Rails — the deviation is concentrated in the `JoinDependency` class itself.

This is a behavioral-risk refactor (eager-load instantiation is touchy), so it
is staged: an audit story first produces a method-by-method mapping and a
target design before any convergence story is scheduled.

## Design

Converge in dependency-ordered slices, each behavior-preserving and
test-suite-gated:

1. **Audit/spike** — map every TS `JoinDependency` member to its Rails
   counterpart (or mark it port-only), identify which port-only members are
   load-bearing vs vestigial, and write the target design into this RFC.
2. **Tree construction** — replace incremental `addAssociation`/
   `_treeNodesByPath`/`_snapshotTree` mutation with Rails' build-once
   `make_tree`/`walk_tree` construction.
3. **Alias handling** — drop `_arelTablesByIndex`/`_aliases` bookkeeping in
   favor of the `AliasTracker` + `Aliases` pair, per Rails.
4. **Join constraints & references** — converge `joinConstraints`/`walk`/
   `makeConstraints` and the `setReferences`/`rebindTableReferences` layer to
   Rails' `join_constraints` signature (references threaded as an argument).
5. **Instantiation** — converge `instantiateFromRows`/`_constructRecursive` to
   Rails' `instantiate`/`construct` shape.

### Target shape (from the audit)

The audit ([full mapping report][audit-report]) maps every member of the TS
`JoinDependency`, `Aliases`, and `JoinLeaf` classes to its Rails counterpart.
Top-level finding: **the deviation is one root cause with many symptoms — the
TS class is built incrementally** (`relation.ts` constructs an empty instance
and calls `addAssociation`/`addAssociationSpec` per spec), whereas Rails builds
the whole tree once in the constructor (`make_tree` → `build`). Nearly all
port-only state exists to support incremental construction: rollback machinery
(`_snapshotTree`/`_restoreTree`/`_rollbackTree`), the path index
(`_treeNodesByPath`), eager alias bookkeeping (`_nextTableIndex`/`_aliases`/
`_arelTablesByIndex`), and the after-the-fact predicate rebinding
(`rebindTableReferences`/`_rebindChildOnPredicates`). The build-once half of
the class (`joinConstraints`, `makeJoinConstraints`, `walk`, `aliases`,
`instantiate`/`construct`, `findReflection`, `build`) is already a faithful or
renamed-equivalent port, so convergence is mostly _deleting_ the incremental
layer and routing through methods that already exist.

Target, story by story:

1. **Build-once constructor.** `JoinDependency(base, associations, joinType)`
   calls `makeTree`/`walkTree` → `build` in the constructor; `relation.ts`
   passes the full eager-load hash instead of calling `addAssociation*`
   incrementally. Deletes `_treeNodesByPath`, snapshot/restore/rollback, the
   whole `addAssociation*`/`_walkSpec`/`_addOrReuse`/`_insertTreeNode` family,
   `_nextTableIndex`, and the vestigial `_resolveTreeParent`/`_baseTableIndex`.
   Adopts the currently-unused static `makeTree`/`walkTree`.
2. **Lazy `Aliases` from the tree.** Build `aliases()` from a
   `join_root.each_with_index` walk and move arel-table ownership onto
   `Aliases::Table`. Deletes `_aliases`, `_arelTablesByIndex`,
   `_buildBaseAliases`, and the `_buildSelectArelNodes` side-map.
3. **Alias resolution at constraint time.** Un-hollow `make_constraints` to
   resolve aliases via `AliasTracker.aliased_table_for` + `@joined_tables`.
   Deletes `rebindTableReferences`, `_rebindChildOnPredicates`, and
   `setReferences` (references thread through `joinConstraints`).
4. **`through` via `reflection.chain`.** Drive the chain inside
   `make_constraints` so intermediates are `JoinAssociation` nodes; deletes
   `_addThroughViaJoinAssociation` and allows deleting `JoinLeaf`.
5. **`instantiate`/`construct` to Rails shape.** Converge to Rails' `seen` /
   `model_cache` / `compare_by_identity` structure and move `_isNodeReadonly`/
   `_isNodeStrictLoading` onto `JoinPart` (`readonly?`/`strict_loading?`).

Out of scope (flag separately): `_addStiConstraintArel` belongs to association
scope convergence, not 0027.

[audit-report]: https://github.com/blazetrailsdev/trails/blob/main/docs/activerecord/rfc-0027-join-dependency-audit.md

## Alternatives considered

- **Port more enumerable helpers to activesupport first.** Rejected — measured
  the Rails file's dependencies: `each_with_object`, `flat_map`, `partition`,
  `Array()`; JS natives plus existing `collections.ts` already cover them.
  Would shave tens of lines, not the ~900-line structural gap.
- **Leave as-is; the file is verbose but behaviorally faithful.** Viable, but
  every join fix pays a translation tax and the area is under active churn
  (#3143, #3145). Staging behind an audit keeps the option to stop after
  story 1 if the mapping shows convergence is poor value.

## Rollout

1. `audit-join-dependency-rails-mapping` (gates everything)
2. `converge-tree-construction-make-tree`
3. `converge-alias-tracking`
4. `converge-join-constraints-references`
5. `converge-instantiate-construct`

## Open questions

1. **Is `eagerSpecToTree`/`_walkSpec` validation truly port-only?**
   **Resolved (audit): stays, not vestigial.** `validateEagerLoadSpec` (with
   `build`/`findReflection`/`eagerSpecToTree`) is load-bearing — the
   calculation/exists path (`relation.ts:2945`) needs eager-spec validation
   (`ConfigurationError`/`EagerLoadPolymorphicError`) _without_ building the
   real join tree. It is already a faithful port of Rails `build` (where the
   validation is a side effect of `build` during `construct_join_dependency`).
   Post-story-2 it collapses into a thin entry point over the shared `build`.
   `_walkSpec` itself (the incremental spec walker) _is_ absorbable into
   `make_tree`/`walk_tree` and dissolves in story 2.
2. **Stop-or-go after the audit. Resolved: GO on stories 2–5.** The port-only
   state is overwhelmingly _incremental scaffolding_, not TS-language
   necessity — the one genuine TS-specific concern (no `method_missing` on
   join rows) lives in small proxy-wiring helpers that survive convergence.
   The build-once half of the class already exists and is faithful, so
   convergence is mostly _deleting_ the incremental layer. Scheduling notes:
   story 2 (build-once tree) is the keystone and must land first and alone
   (it migrates `relation.ts` callers); story 4 (`through` + constraints) is
   the highest behavioral risk and needs extra review.

## Changelog

- 2026-06-12: initial RFC
- 2026-06-14: add `converge-references-lazy-make-constraints` — the signature
  convergence (#3253) left reference _consumption_ eager (`void references` in
  `joinConstraints`, aliasing resolved at build in `addAssociation`). This
  story finishes the convergence: `make_constraints` consumes references lazily
  per Rails `join_dependency.rb:202`. Surfaced by RFC 0023's deviation story
  (PR #3299), which now documents the divergence as pending-convergence rather
  than wontfix.
