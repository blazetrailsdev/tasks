---
title: "JoinDependency#reflections should include through-intermediate reflections (join_root.drop(1).map!(:reflection))"
status: closed
updated: 2026-07-04
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "won't-do: premise empirically false vs Rails 8.0.2 (intermediate through reflections not included); trails main already matches, including them would diverge and regress fidelity"
---

## Context

`JoinDependency#reflections` (`packages/activerecord/src/associations/join-dependency.ts:571`)
walks `_joinRoot.eachChildren` and skips synthetic through-intermediate nodes:
those have `isThroughNode = true` and `immediateAssocName = "_through_<name>"`,
so `_reflectOnAssociation(parent.baseKlass, child.immediateAssocName)` returns
null and the intermediate reflection is omitted. Rails'
`JoinDependency#reflections` is `join_root.drop(1).map!(&:reflection)`
(vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:81-82),
which includes every node's reflection — intermediate through reflections too.

Surfaced during review of PR #4089
(`eager-reflections-limitable-nested-hash-convergence`), which made both clauses
of `_applyJoinDependencyIsLimitable` consume `jd.reflections`. For the
`using_limitable_reflections?` use the divergence is inert in practice — the
outer through reflection carries the collection-ness of the path, so
`none?(&:collection?)` lands on the same answer — but `reflections` is a public
JoinDependency accessor and any other consumer expecting the full Rails set
(including intermediates) would see a short list.

## Acceptance criteria

- [ ] `JoinDependency#reflections` includes through-intermediate reflections,
      matching Rails `join_root.drop(1).map!(&:reflection)` (resolve the real
      reflection behind each `_through_<name>` synthetic node rather than
      skipping it).
- [ ] Existing `usingLimitableReflections` callers
      (`_eagerReflectionsAreLimitable`, `_joinsReflectionsAreLimitable`) keep
      their current results (intermediates are non-collection or already
      represented).
- [ ] test:compare / api:compare delta >= 0.
