---
title: "Fold a through chain into one JoinAssociation node so reflections needs no filter"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into converge-join-dependency-through-chain-single-node — duplicate story describing the same deviation; the surviving body carries both sets of Rails and trails file:line citations"
---

## Context

Rails represents a `has_many :through` as ONE `JoinAssociation` node whose
`reflection.chain` carries the hops
(`activerecord/lib/active_record/associations/join_dependency.rb:81-83` reads
`join_root.drop(1).map!(&:reflection)` over exactly those nodes; every non-root
node has a reflection).

trails materializes each chain hop as its own tree node: the non-target hops are
`JoinLeaf`s named `_through_<name>`
(`packages/activerecord/src/associations/join-dependency.ts`,
`_addThroughViaJoinAssociation`), and they carry no `reflection`. That forces
`JoinDependency#reflections` (same file) to append a
`.filter((reflection) => reflection != null)` that Rails does not have — an
otherwise faithful `drop(1).map(&:reflection)` cannot be written without it.

## Converged shape

Fold a through chain back into a single `JoinAssociation` tree node whose
`reflection` is the through reflection, with the hops living in the reflection's
chain the way `JoinAssociation#join_constraints`
(`join_dependency/join_association.rb`) already walks them. Then drop the
`.filter` from `reflections` so the body is Rails' one line.

Note the emit-time machinery (`ThroughJoinGroup`, `_resolveThroughGroup`,
`tableIndex = -1` for reused chain tails) is keyed on the per-hop nodes, so this
is a real restructure, not a rename.

## Acceptance criteria

- [ ] A through association is one tree node carrying the through reflection.
- [ ] `reflections` is `joinRoot.drop(1).map((node) => node.reflection)`, no filter.
- [ ] Join SQL and aliasing for through/nested-through eager loads unchanged.
