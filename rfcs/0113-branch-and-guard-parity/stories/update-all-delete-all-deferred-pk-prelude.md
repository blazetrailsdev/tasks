---
title: "Drop the deferred-distinct-PK prelude from Relation#update_all / #delete_all"
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 80
priority: 59
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#7699, which converged `Relation#updateAll` / `#deleteAll`
onto `model.withConnection` (`relation.rb:605-618`, `:1022-1035`).

Both trails bodies still open with a step Rails does not have:

```ts
await this._materializeDeferredDistinctPkPredicates();
```

(`packages/activerecord/src/relation.ts`, `updateAll` and `deleteAll`, right
after the `isNullRelation()` guard). Rails' `update_all` / `delete_all` go
straight from the guards to `model.with_connection do |c|`; deferred
distinct-PK predicates are a trails-only representation of eager-loaded
limited-collection subqueries that must resolve to a literal id list before
arel compiles.

`hoist-schema-load-and-deferred-pk-materialization-out-of-ported-bodies`
(RFC 0112, done) removed the same prelude from `ids` / `pluck` and the
calculation entry points, but its criteria did not name `update_all` /
`delete_all`, so the prelude survives there.

## Converged shape

`updateAll` / `deleteAll` read as `relation.rb:588-618` / `:1011-1035` line for
line; deferred PK predicates are materialized at the same seam the RFC 0112
story chose for `ids` / `pluck` (outside the ported body), not inline.

## Acceptance criteria

- Neither body calls `_materializeDeferredDistinctPkPredicates`.
- `update_all` / `delete_all` on an eager-loaded limited relation still compile
  a literal id list (add or keep a test covering it).
