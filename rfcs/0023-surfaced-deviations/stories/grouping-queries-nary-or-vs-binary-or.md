---
title: "grouping_queries emits n-ary Or vs Rails' nested binary Or"
status: draft
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

Rails' `PredicateBuilder#grouping_queries` folds multiple query groups with
a **binary** OR reduction —
`queries.reduce { |result, q| Arel::Nodes::Or.new(result, q) }` — producing
a right/left-nested chain of binary `Arel::Nodes::Or` nodes wrapped in one
`Arel::Nodes::Grouping`.

trails emits a single **n-ary** `Nodes.Or([...])` instead
(predicate-builder.ts:265 in `groupingQueries`, and the analogous
association path at predicate-builder.ts:489). `Nodes.Or` extends Arel's
`Nary`, so the generated SQL is identical (`(a) OR (b) OR (c)`), but the AST
shape differs from Rails' nested binary chain.

This is cosmetic for SQL output but can matter for anything that walks or
pattern-matches the Arel AST (visitors, `to_sql` structural assertions,
api:compare node-shape checks). Not aggregate-specific — the aggregate
branch reuses the shared `groupingQueries` helper.

Relevant Rails:
`activerecord/lib/active_record/relation/predicate_builder.rb#grouping_queries`.

## Acceptance criteria

- [ ] Decide with the RFC owner whether to converge `groupingQueries` to
      Rails' binary `Or.new(memo, expr)` reduction or ratify the n-ary
      `Nodes.Or` as an intentional flattening (document the decision).
- [ ] If converging: emit the nested binary `Or` chain and confirm SQL is
      unchanged; keep `groupingQueries` callers (association + aggregate
      multi-mapping) green.
