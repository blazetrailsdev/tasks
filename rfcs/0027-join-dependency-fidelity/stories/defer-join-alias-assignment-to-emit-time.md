---
title: "Defer JoinDependency alias assignment to emit-time shared tracker"
status: claimed
updated: 2026-06-22
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 20
pr: null
claim: "2026-06-22T18:19:57Z"
assignee: "defer-join-alias-assignment-to-emit-time"
blocked-by: null
---

## Context

Rails assigns join-table aliases lazily at emit time: `build_joins` creates one
`alias_tracker` and every `JoinDependency#join_constraints` →
`make_constraints` calls `aliased_table_for` against it
(`active_record/associations/join_dependency.rb`, `alias_tracker.rb:58-77`).

trails bakes alias assignment in at JoinDependency **construction**
(`JoinDependency#_addAssociation`, join-dependency.ts:277) using a per-dep
`_aliasTracker` seeded only with the base alias. PR #3823 converged the
cross-model `merge` case (`relation_test` `..._is_aliased` / `..._aliased_works`)
by adding an emit-time re-alias pass
(`JoinDependency#realiasAgainstSharedTracker`) plus a shared tracker built in
`relation/merged-join-alias-tracker.ts`, threaded through both
`_applyJoinsToManager` and `buildJoins`. This works but is a workaround: aliasing
still happens at construction first, then gets re-resolved at emit. A faithful
convergence would defer ALL alias assignment to emit-time `make_constraints`
against the single shared tracker, removing the construction-time aliasing and
the re-alias pass.

## Acceptance criteria

- [ ] JoinDependency assigns table aliases lazily in `makeConstraints`
      (emit-time) against the shared AliasTracker, not in `_addAssociation`.
- [ ] `realiasAgainstSharedTracker` + the separate seed/re-alias plumbing in
      `relation/merged-join-alias-tracker.ts` become unnecessary and are removed
      (or reduced to the tracker construction).
- [ ] All existing join/merge/where-chain/eager tests still pass; the two
      `relation_test` merge-aliasing tests stay green.
- [ ] `test:compare` non-negative, `api:compare` non-negative.
