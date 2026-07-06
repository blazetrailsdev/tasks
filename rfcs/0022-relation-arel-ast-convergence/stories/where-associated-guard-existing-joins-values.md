---
title: "where.associated must skip joins! when association already in joins_values/left_outer_joins_values"
status: ready
updated: 2026-07-06
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `WhereChain#associated` (`vendor/rails/activerecord/lib/active_record/
relation/query_methods.rb:88-101`) guards before joining:

```ruby
unless @scope.joins_values.include?(reflection.name) ||
       @scope.left_outer_joins_values.include?(reflection.name)
  @scope.joins!(association)
end
```

The trails port (`packages/activerecord/src/relation/query-methods.ts` ~line 68,
`WhereChain.associated`) omits this guard — it calls `scopeAssociationReflection`
then `whereAssociated` and never reads `joins_values` / `left_outer_joins_values`,
so it can add a duplicate join for an association already joined. Surfaced by
PR #4656 as a residual wide-call mismatch (`associated -> joins_values` /
`left_outer_joins_values`) in `call-mismatches-wide-exclude.json`.

## Acceptance criteria

- Port the guard: skip `joins!(association)` when the association name is already
  in `joinsValues` or `leftOuterJoinsValues`.
- Add a test mirroring Rails' where.associated behavior on an already-joined
  association (no duplicate join).
- Remove the converged `associated` wide-call baseline entries.
