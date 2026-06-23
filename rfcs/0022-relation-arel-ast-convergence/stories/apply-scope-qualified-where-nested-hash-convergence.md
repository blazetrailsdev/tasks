---
title: "Route AssociationScope#applyScope qualified WHERE fully through predicate-builder nested-hash (drop hand-built Arel node)"
status: claimed
updated: 2026-06-23
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-23T10:45:35Z"
assignee: "apply-scope-qualified-where-nested-hash-convergence"
blocked-by: null
---

## Context

`AssociationScope#applyScope` qualified branch (packages/activerecord/src/associations/association-scope.ts:341-366) still hand-builds the Arel predicate node `table.get(key).eq(bind)` rather than routing the whole condition through the predicate builder the way Rails does:

```ruby
# activerecord/lib/active_record/associations/association_scope.rb:161-167
def apply_scope(scope, table, key, value)
  if scope.table == table
    scope.where!(key => value)
  else
    scope.where!(table.name => { key => value })  # <- nested-hash path
  end
end
```

PR #3959 converged the BIND derivation (now `new PredicateBuilder(table).buildBindAttribute(key, value)`, matching the unqualified `where({key:value})` / `BasicObjectHandler` path) but deliberately kept the Arel alias NODE qualifying the column. trails qualifies by the alias node so a self-referential `has_many :through` alias (`children_imageables`, etc.) emits `"alias"."col"`; Rails' `table.name => {...}` nested hash relies on `PredicateBuilder#expand_from_hash` resolving the key via `associatedTable` (predicate-builder.ts:85-106), which does not have the AliasTracker-produced alias registered.

## Blocker

Full convergence to `scope.where!(table.name => { key => value })` requires the predicate builder's nested-hash `associatedTable` resolution to recognize AliasTracker aliases and qualify by the alias node — otherwise the bare `table.name` lookup either misses the type caster or emits the real table name instead of the alias, breaking self-referential / aliased through chains.

## Acceptance criteria

- [ ] `applyScope`'s qualified branch routes the full condition through `scope.where!(table.name => { key => value })` (or documented equivalent), eliminating the hand-built `table.get(key).eq(bind)` Arel node, while still qualifying by the alias for aliased/self-referential through chains.
- [ ] No regression in through / nested-through / self-referential-through loads on SQLite, PostgreSQL, MySQL (incl. string-FK `publication.editors`).
- [ ] If the predicate-builder alias-resolution work is out of scope, document the residual with the specific predicate-builder change required.
