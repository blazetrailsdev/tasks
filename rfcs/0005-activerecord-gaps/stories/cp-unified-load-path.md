---
title: "CollectionProxy — unify toArray/load to a single exec-queries path (Rails parity)"
status: claimed
updated: 2026-06-06
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 150
priority: 36
pr: null
claim: "2026-06-06T01:52:11Z"
assignee: "cp-unified-load-path"
blocked-by: null
---

## Context

`CollectionProxy#toArray` / `load` currently have two paths:

1. **Non-diverged** (`_cpMutated=false`): calls `loadHasMany(owner, name, opts)`
   directly and then manually calls `_cascadeStrictLoading`.
2. **Diverged** (`_cpMutated=true`): calls `super.toArray()` (generic Relation
   query) and calls `_cascadeStrictLoading`.

In Rails there is no such split. `CollectionProxy` delegates to
`AssociationRelation#exec_queries` → `CollectionAssociation#exec_queries` →
`loadTarget`, which always routes through the OO association regardless of
whether the scope has been mutated.

The split exists in this port because `loadHasMany` (and therefore
`HasManyAssociation#doAsyncFindTarget`) does not accept a scope override — it
always rebuilds the query from the owner + reflection options. So when the proxy
is mutated the only option is `super.toArray()`.

## Acceptance criteria

- [ ] `loadHasMany` (or a new `execHasManyQuery`) accepts an optional
      `Relation`-shaped scope override so callers can inject whereBang / orderBang
      mutations without rebuilding from scratch
- [ ] `CollectionProxy#toArray` and `load` use a single code path that routes
      through the OO association for both the mutated and unmutated cases; the
      `_relationStateDiverged` split is removed
- [ ] `_cascadeStrictLoading` is called in exactly one place (inside
      `CollectionAssociation.loadTarget` or the unified path), not duplicated
      across branches
- [ ] All existing strict-loading cascade tests continue to pass; diverged-path
      tests (whereBang + await proxy) added to cover the unified path

## Notes

Follow-up to PR #2964 (strict-loading-cascade-proxy). The diverged-path cascade
fix in that PR is correct; this story is a Rails-parity refactor. The LOC
estimate covers both the `loadHasMany` scope-override plumbing and the
CollectionProxy simplification.
