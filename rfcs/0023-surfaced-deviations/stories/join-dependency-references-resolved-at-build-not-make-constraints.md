---
title: "JoinDependency resolves references aliasing eagerly at build, not in make_constraints"
status: ready
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In Rails, `JoinDependency#join_constraints(joins_to_add, alias_tracker,
references)` consumes `references` lazily inside `make_constraints` during
constraint emission. trails resolves all table aliasing eagerly at
tree-construction time (`addAssociation`), so references are fully consumed by
`addAssociationSpec` and the `references` param on `joinConstraints` is accepted
only for Rails arity fidelity (`void references`).

This is a deliberate architectural divergence (precompute vs lazy emit) carried
since `converge-alias-tracking`. Tracking it so triage can decide whether to
converge toward Rails' lazy `make_constraints` aliasing (which would let
`joinConstraints` genuinely consume `references` and remove the `void`), or
ratify the eager model and document it as intended.

## Acceptance criteria

- [ ] Decide: converge to lazy make_constraints aliasing, or ratify eager model.
- [ ] If converging: `joinConstraints` consumes `references`; `void references`
      and build-path threading removed.
- [ ] If ratifying: document the divergence in the join-dependency module and
      close as wontfix-by-design.
