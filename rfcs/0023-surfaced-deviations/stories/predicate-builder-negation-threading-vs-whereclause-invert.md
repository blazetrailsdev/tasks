---
title: "predicate-builder threads negation instead of inverting WhereClause (Rails)"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting the `composed_of` aggregate expansion for
`converge-where-composed-of-aggregate-expansion` (PR #4431).

Rails' `ActiveRecord::PredicateBuilder` is _always positive_:
`expand_from_hash` / `build_from_hash` never negate. `where.not(...)` is
implemented one level up by inverting the whole `WhereClause`
(`ActiveRecord::Relation::WhereClause#invert` → `WhereClause#not`, which
flips each predicate / wraps the AST), NOT by threading a "negated" flag
into the predicate builder.

trails deviates: `predicate-builder.ts` threads a `negated: boolean`
through the hash-expansion path instead —
`buildNegatedFromHash` → `buildFromHashInternal(conditions, true, …)`
(predicate-builder.ts:71-135), and every branch (association, aggregate,
default) re-implements negation locally:

- association plain-hash branch recurses via `buildNegatedFromHash` (line 104)
- aggregate single-mapping recurses via `buildNegatedFromHash` (line 156)
- `groupingQueries(queryGroups, negated)` wraps groups in `NOT (...)` (line 252)
- scalar default calls `buildNegated(attr, value)` (line 131)

This is a repo-wide architectural divergence, not aggregate-specific; the
aggregate branch just followed the established local convention. Because
negation is applied per-branch rather than by inverting the assembled
`WhereClause`, edge cases (NULL handling in `NOT IN`, `rewhere`/
`extract_attributes` interaction, multi-column groups) can drift from
Rails' single-inversion semantics.

Relevant Rails: `activerecord/lib/active_record/relation/where_clause.rb`
(`#invert`, `#not`, `#except_predicates`) and
`activerecord/lib/active_record/relation/predicate_builder.rb`
(`expand_from_hash` — no negation).

## Acceptance criteria

- [ ] Audit `predicate-builder.ts` negation threading vs Rails
      `WhereClause#invert`; decide the convergence shape (invert the
      assembled clause vs keep per-branch) with the RFC owner.
- [ ] Converge so `where.not(hash)` semantics match Rails for the tricky
      cases: `NOT IN` with NULLs, negated association/aggregate multi-column
      groups, and `rewhere` predicate extraction.
- [ ] Existing `where.not` / `excluding` tests stay green; add ports for any
      Rails `where.not` cases not yet covered.
