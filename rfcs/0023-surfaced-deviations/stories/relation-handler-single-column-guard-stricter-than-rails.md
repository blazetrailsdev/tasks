---
title: "RelationHandler single-column subquery guard is stricter than Rails (converge or justify)"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`RelationHandler.ensureSingleColumnSelect`
(`packages/activerecord/src/relation/predicate-builder/relation-handler.ts:41-65`)
throws for a subquery whose single `selectValues` entry is a `*`, a `table.*`,
or a comma-joined projection:

```text
Expected subquery for <attr> to select a single column, but got ambiguous projection: <trimmed>
```

and throws again when `selectValues.length > 1`.

Rails' `PredicateBuilder::RelationHandler#call`
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder/relation_handler.rb`)
has **no such validation**. It only injects the PK select when
`select_values` is empty; otherwise it passes the relation straight to
`attribute.in(value.arel)` and lets the database raise if the subquery yields
the wrong column count. The trails guard is stricter than Rails and can reject
inputs Rails accepts (e.g. a deliberately multi-column subquery that a given
backend tolerates, or a `*` projection a caller intends).

## Acceptance criteria

- [ ] Decide convergence per feedback (always converge, never ratify): either
      remove the bespoke `ensureSingleColumnSelect` throwing branches so the
      handler matches Rails (`attribute.in(value.arel)` regardless of projection
      shape, DB raises on mismatch), or document a precise Rails-source
      justification for keeping a guard.
- [ ] Any trails test asserting the bespoke error message is reconciled (no test
      renames; fix behavior, not names) and the corresponding Rails test
      (`relation_test.rb` / `where_test.rb` subquery cases) is mirrored.
- [ ] `test:compare` / `api:compare` delta ≥ 0.

## Rails source

- `vendor/rails/activerecord/lib/active_record/relation/predicate_builder/relation_handler.rb`
  (no single-column validation; only the empty-select PK injection + composite-pk
  ArgumentError).

## Notes

- Surfaced during PR #3383 (`relation-handler-distinct-pk-materialization`),
  where the empty-select PK branch was made Rails-faithful but the bespoke
  single-column guard was left in place as out-of-scope.
- Sibling guard already converged: `from-subquery-alias-guard-stricter-than-rails`
  (done) removed an analogous stricter-than-Rails alias guard.
