---
title: "Route where.associated/where.missing joins through JoinDependency/AliasTracker instead of the flat string ON-rebind path"
status: ready
updated: 2026-07-08
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps:
  - unify-alias-tracker-across-join-buckets
deps-rfc: []
est-loc: 250
priority: 41
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails' `where.associated` / `where.missing` (WhereChain in
`packages/activerecord/src/relation/query-methods.ts:70-91`, implementations
`whereAssociated` / `whereMissing` in `packages/activerecord/src/relation.ts:~800-895`)
hand-build the LEFT OUTER JOIN via a bespoke resolver
(`_resolveAssociationTarget`, relation.ts:~1000-1100) plus `_addAssocJoin`
instead of routing through the normal association-join machinery.

Rails' `WhereChain#associated` / `#missing`
(vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:88-92,
124-128) simply do `@scope.joins!(association)` /
`@scope.left_outer_joins!(association)` and then add the
`table[primary_key].not_eq(nil)` / `eq(nil)` predicate — the join itself is
built by JoinDependency, so every association shape Rails can join (through,
HABTM, polymorphic-with-source-type, composite PK/FK, nested) works for free.

Consequences of the bespoke path (all self-documented in relation.ts):

- through/HABTM require a registered intermediate model or throw
  ("association resolution failed ... through/HABTM associations may require a
  registered intermediate model", relation.ts:~860).
- composite foreignKey / primaryKey in the fallback path throw trails-only
  errors ("composite foreignKey ... not yet supported in fallback path",
  relation.ts:~1089).
- belongsTo without a registered target model falls back to a source-table FK
  null check — data-correct but not the Rails JOIN form.
- a parallel alias tracker (`_unifiedJoinAliasTracker`) exists solely to keep
  the bespoke joins from colliding with JoinDependency-minted aliases.

Converge: build the join with the same JoinDependency path `joins()` /
`leftOuterJoins()` use (as Rails does), then push the PK null/not-null
predicate; delete `_resolveAssociationTarget`, `_addAssocJoin`, and the
fallback branches.

## Acceptance criteria

- [ ] `whereAssociated` / `whereMissing` route the association join through
      `joins!` / `leftOuterJoins!` (JoinDependency), mirroring
      query_methods.rb:88-92 / 124-128, instead of `_resolveAssociationTarget`.
- [ ] through / HABTM / composite-key shapes that JoinDependency already joins
      work via where.missing/associated without the trails-only
      ConfigurationError-style throws; the bespoke resolver and its fallback
      branches are deleted.
- [ ] Existing where-chain tests stay green (test names unchanged); add
      coverage mirroring Rails relations_test.rb where.missing/associated cases
      for a through association.
