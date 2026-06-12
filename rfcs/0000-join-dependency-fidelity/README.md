---
rfc: "0000-join-dependency-fidelity"
title: "JoinDependency fidelity — converge internal state model to Rails' build-once walk/construct shape"
status: draft
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

<!-- Unnumbered until merge: keep `rfc:` as 0000-join-dependency-fidelity and
     the H1 below number-free. `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. Never use a `draft-` prefix. -->

# RFC — JoinDependency fidelity

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

1. **Is `eagerSpecToTree`/`_walkSpec` validation truly port-only?** Rails
   validates eager-load specs elsewhere (`Relation#eager_loading?` path); the
   audit decides whether this layer moves, stays, or dissolves.
2. **Stop-or-go after the audit.** If the mapping shows most port-only state
   is load-bearing for TS-specific reasons (e.g. no `method_missing` on join
   rows), close stories 2–5 unscheduled rather than force the shape.

## Stories

| ID                                                                                      | Title                                           | Status | Est LOC |
| --------------------------------------------------------------------------------------- | ----------------------------------------------- | ------ | ------- |
| [audit-join-dependency-rails-mapping](stories/audit-join-dependency-rails-mapping.md)   | Audit: map TS JoinDependency to Rails           | draft  | 0       |
| [converge-tree-construction-make-tree](stories/converge-tree-construction-make-tree.md) | Converge tree construction to make_tree         | draft  | 450     |
| [converge-alias-tracking](stories/converge-alias-tracking.md)                           | Converge alias handling to AliasTracker/Aliases | draft  | 400     |
| [converge-join-constraints-references](stories/converge-join-constraints-references.md) | Converge join_constraints & references          | draft  | 400     |
| [converge-instantiate-construct](stories/converge-instantiate-construct.md)             | Converge instantiate/construct                  | draft  | 450     |

## Changelog

- 2026-06-12: initial RFC
