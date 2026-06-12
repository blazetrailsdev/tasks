---
title: "Converge join_constraints and the references path to Rails' signatures"
status: draft
updated: 2026-06-12
rfc: "0000-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-alias-tracking"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
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

- [ ] `setReferences` and the stored `_references` field are gone; references arrive as a join_constraints argument.
- [ ] `walk` handles outer-join reuse per Rails (partition on table match); rebind helpers deleted or reduced to the Rails-visible behavior.
- [ ] All references()/eager_load tests pass unchanged.
- [ ] Diff under the 500 LOC ceiling.
