---
title: "disable-joins-first-orders-in-sql-not-memory"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

`vendor/rails/activerecord/test/cases/associations/has_many_through_disable_joins_associations_test.rb:171-174`
(`test_first_and_scope_in_double_join_applies_order_in_memory`) asserts the last captured SQL of
`@author.no_joins_members.unnamed.first` has no `ORDER BY`: the order is applied in memory
(`disable_joins_association_scope.rb:49-51`, `DisableJoinsAssociationRelation`).

trails' last query is `SELECT "members".* FROM "members" WHERE ...` containing `ORDER BY`
(`packages/activerecord/src/associations/disable-joins-association-scope.ts`,
`disable-joins-association-relation.ts`), so `first` orders in SQL.

`has-many-through-disable-joins-associations.test.ts` carries this as `it.skip` pointing at this story.

## Acceptance criteria

- `no_joins_members.unnamed.first` emits no `ORDER BY` in its final query.
- The skipped test is un-skipped and passes.
