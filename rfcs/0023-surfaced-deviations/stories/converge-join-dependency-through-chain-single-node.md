---
title: "Converge the through chain onto one JoinAssociation per reflection"
status: draft
updated: 2026-08-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Converge the `through` chain onto one JoinAssociation per reflection

## Context

Surfaced converging `JoinDependency#build` in PR #6578, which ported
`build(associations, base_klass)` onto Rails' recursive node tree but left the
through-chain node model as it was.

`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:228-240`
builds exactly ONE `JoinAssociation` per reflection, including a
`through` reflection. The chain's intermediate joins are emitted at
constraint time by
`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb`
(`join_constraints` walks `reflection.chain.reverse_each` and emits one join
per link), so the TREE never contains a node for a through link.

trails' `_addThroughViaJoinAssociation`
(`packages/activerecord/src/associations/join-dependency.ts`) instead
materializes one tree node per chain link — the target plus a synthetic
`JoinLeaf` per link, named `_through_<reflection name>` — pushed as SIBLINGS of
the target under the same parent, with a shared `ThroughJoinGroup` resolving
their aliases at emit. That is why `build` has to `flatMap` and pick
`nodes[nodes.length - 1]` as the attach point for nested children, where Rails
maps 1:1 and returns the node it just constructed.

The synthetic leaves also leak: `relation.ts` skips nodes whose
`immediateAssocName` starts with `_through_` when wiring preloaded proxies, and
`aliases()` has to reason about which tree nodes are real reflected nodes.

## Converged shape

A `through` reflection produces ONE `JoinAssociation` node, as
join*dependency.rb:239 does; the chain's intermediate joins are emitted from
`JoinAssociation#joinConstraints` at emit time without any tree node standing
for them. `build`'s body then maps 1:1 —
`new JoinAssociation(reflection, this.build(right, reflection.klass))` — with no
flatMap and no last-element attach point, and the `\_through*`name prefix and
the`ThroughJoinGroup`sibling bookkeeping disappear along with the`JoinLeaf` class.

## Acceptance criteria

- [ ] `_addThroughViaJoinAssociation` returns a single node (or is inlined into
      the node construction `build` already does).
- [ ] No `_through_`-prefixed tree nodes; `relation.ts`'s `_through_` skip and
      the `JoinLeaf` class are deleted.
- [ ] `build` maps 1:1 over the associations hash, mirroring
      join_dependency.rb:228-240 with no flatMap.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
