---
title: "DisableJoinsAssociationScope add-constraints keeps a non-Rails isNullRelation() early return"
status: draft
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DisableJoinsAssociationScope`'s add-constraints body (`packages/activerecord/src/associations/disable-joins-association-scope.ts:109`, `_addConstraintsDj`) was converged onto `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:36-50` in trails#8292, with one remaining arm Rails does not have:

```ts
if (scope.orderValues.length === 0 && ordered) {
  if (scope.isNullRelation()) return scope;   // :141 — not in Rails
  const Ctor = relationClassFor.call(DisableJoinsAssociationRelation, scope.model);
  ...
```

Rails (`disable_joins_association_scope.rb:44-49`) goes straight to
`DisableJoinsAssociationRelation.create(scope.model, key, join_ids)` followed by
`split_scope.where_clause += scope.where_clause`. A `none` scope needs no special case, because
`none!` (`relation/query_methods.rb`, `where!("1=0")`) puts `1=0` in the where clause, and the split
scope inherits it through `+=`. trails' `noneBang` (`relation/query-methods.ts:1035`) adds the same
`1=0` literal.

The guard came in with #5165 (`Relation#none? falls through to empty? query`). It short-circuits
before the split relation's own records query. Find out which #5165 test depends on it, then make
the split relation honour the inherited `1=0` / null-relation state itself.

## Acceptance criteria

- The `isNullRelation()` early return is removed from the DJ add-constraints body, which then reads
  as `disable_joins_association_scope.rb:44-49`.
- Whatever #5165 relied on (no query issued for a `none` through a disable_joins association) still
  holds, handled where Rails handles it (the relation's null-relation path), not in the scope builder.
- `packages/activerecord/src/associations/` and `disable-joins-association-relation.test.ts` pass on
  SQLite, PostgreSQL and MySQL.
