---
title: "Polymorphic association branch flat-Ands query groups instead of grouping_queries OR-of-AND"
status: in-progress
updated: 2026-07-23
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5151
claim: "2026-07-23T14:52:35Z"
assignee: "poly-association-branch-flat-and-bypasses-grouping-queries"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `grouping-queries-flat-and-vs-binary-and-reduce`
(PR #5098). The polymorphic/PK-normalized association branch of
`expandFromHash` (`packages/activerecord/src/relation/predicate-builder.ts:230-237`
as of #5098) flattens all `AssociationQueryValue#queries()` results with
`flatMap` and wraps them in ONE flat `new Nodes.And(inner)`
(returning it as a single node when `inner.length > 1`).

Rails' counterpart
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:118-125`)
instead maps each query through `expand_from_hash` separately and routes
the per-query groups through `grouping_queries`: a single group is
returned FLAT (separate where-clause entries — which
`WhereClause#extract_attributes`/`rewhere` rely on), and multiple groups
become pairwise-reduced Ands ORed inside one Grouping. Two divergences:

- Single query group: trails emits an `And` wrapper where Rails keeps the
  predicates flat/addressable.
- Multiple query groups (e.g. polymorphic values spanning types): trails
  ANDs across groups where Rails ORs the AND-reduced groups — potentially
  a semantic difference, not just AST shape.

The sibling core path (predicate-builder.ts:240-252) already routes
through `groupingQueries`, converged to Rails' pairwise reduce shape by
PR #5098; this branch should do the same.

## Acceptance criteria

- [ ] Route the polymorphic/PK-normalized branch's per-query groups
      through `groupingQueries` (per-query `buildFromHash` groups, not
      one flatMap), mirroring predicate_builder.rb:118-125.
- [ ] Add/verify a test covering a multi-type polymorphic value to pin
      the OR-of-AND grouping (check Rails' cases for the matching test
      name before writing one).
- [ ] Existing association/polymorphic where tests stay green.
