---
title: "JoinDependency: join composite-PK model's composite-FK belongsTo association"
status: claimed
updated: 2026-07-01
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-07-01T12:54:48Z"
assignee: "cpk-join-dependency-composite-fk-belongs-to"
blocked-by: null
---

## Context

PR #4363 (`cpk-join-dependency-composite-fk-collection`) relaxed the
`JoinDependency#addAssociation` composite-key bail **only for reflection-backed
collection (has_many/has_one)** joins — `JoinAssociation#joinConstraints` builds
the composite FK↔PK tuple ON clause. The **belongsTo** path still bails on a
composite FK:

`packages/activerecord/src/associations/join-dependency.ts:263-264`

```ts
foreignKey = assocDef.options.foreignKey ?? `${_toUnderscore(assocName)}_id`;
if (Array.isArray(foreignKey)) return null;
```

So `CpkBook.eagerLoad("order")` (`belongsTo("order", { foreignKey:
["shop_id","order_id"] })`, target `CpkOrder` PK `["shop_id","id"]`) and the
nested spec `CpkBook.eagerLoad({ chapters: "book" })` (inner `CpkChapter
.belongsTo("book", { foreignKey: ["author_id","book_id"] })`) still fall out of
the join tree and degrade to preload where Rails JOINs.

Evidence the belongsTo case is still unjoinable:
`packages/activerecord/src/relation/cpk-eager-pluck-cache-version-composite-fk-collection.trails.test.ts`
— the "pluck of a nested-hash spec's inner composite-FK belongsTo degrades" test
asserts `{ chapters: "book" }` throws rather than joining.

Rails builds the composite belongsTo ON via the same reflection `join_scope`
path (join_dependency.rb:230-239, join_association.rb#join_constraints); the
belongsTo direction keys `target.association_primary_key = source.foreign_key`
per column. `reflection.check_validity!` (reflection.rb:618-625) already raises
`CompositePrimaryKeyMismatchError` on a belongsTo composite arity mismatch (the
validity call was added in PR #4363).

## Acceptance criteria

- Relax the belongsTo composite-FK bail
  (`join-dependency.ts:264`, plus the `primaryKey`/`targetModelPk` array guards
  at :270 and :330) when a reflection drives the join, mirroring the collection
  relaxation — `joinConstraints` builds the composite tuple ON clause for the
  belongsTo direction.
- `CpkBook.eagerLoad("order")` builds a JOIN node with the composite ON
  (`cpk_orders.shop_id = cpk_books.shop_id AND cpk_orders.id = cpk_books.order_id`),
  no `return null` bail.
- Nested `CpkBook.eagerLoad({ chapters: "book" })` joins both segments.
- Convert the "nested-hash inner composite-FK belongsTo degrades" deviation
  assertion in the trails test to assert joining.
- No regression in existing CPK / join-dependency tests.

## Notes

- The inline (no-reflection) fallback must keep bailing on composite keys (it
  only emits single-column equality).
- A limit/offset over such a belongsTo eager load remains gated by the separate
  composite-PK distinct-materialization deviation
  (`composite-pk-distinct-relation-materialization`, 0023).
