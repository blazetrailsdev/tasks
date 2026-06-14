---
title: "Converge join_constraints and the references path to Rails' signatures"
status: done
updated: 2026-06-14
rfc: "0027-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-alias-tracking"]
deps-rfc: []
est-loc: 400
priority: null
pr: 3253
claim: "2026-06-14T14:12:35Z"
assignee: "converge-join-constraints-references"
blocked-by: null
---

## Context

Converge `joinConstraints`/`walk`/`makeConstraints` to Rails'
`join_constraints(joins_to_add, alias_tracker, references)` shape: references
threaded as an argument rather than the stored `_references` field +
`setReferences` setter, and `rebindTableReferences`/`_rebindChildOnPredicates`
absorbed into the walk the way Rails' `walk` reuses matched outer-join tables
(`partition` + table reassignment).

## Acceptance criteria

- [x] `setReferences` and the stored `_references` field are gone; references arrive as a join_constraints argument.
- [x] `walk` handles outer-join reuse per Rails (partition on table match); rebind helpers deleted or reduced to the Rails-visible behavior.
- [x] All references()/eager_load tests pass unchanged.
- [x] Diff under the 500 LOC ceiling.
