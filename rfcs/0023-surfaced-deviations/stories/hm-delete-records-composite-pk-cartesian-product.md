---
title: "fix: HasManyAssociation#deleteRecords scopes composite-PK via cartesian AND instead of tuple IN"
status: in-progress
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 3731
claim: "2026-06-20T17:37:32Z"
assignee: "hm-delete-records-composite-pk-cartesian-product"
blocked-by: null
---

## Context

`HasManyAssociation#deleteRecords` in `packages/activerecord/src/associations/has-many-association.ts` (around line 158) uses `scopeForRecords` (line 299), which scopes to specific records by looping over query-constraint columns and chaining `.where({col: ids})` per column:

```ts
for (const col of queryConstraints) {
  scope = scope.where({ [col]: records.map((r) => readCol(r, col)) });
}
```

For a composite PK like `[shop_id, order_number]`, this produces:
`WHERE shop_id IN (1,2) AND order_number IN ('A','B')`
which is a cartesian product — it also nullifies/deletes `{shop_id:1, order_number:'B'}` and `{shop_id:2, order_number:'A'}`.

Rails `has_many_association.rb:132–135` does:

```ruby
query_constraints = reflection.klass.composite_query_constraints_list
values = records.map { |r| query_constraints.map { |col| r._read_attribute(col) } }
scope = self.scope.where(query_constraints => values)
```

`where(cols, tuples)` produces a tuple IN (or OR-of-AND), not a cartesian product.

The `CollectionProxy#delete` path (PR #3610) was fixed to use `where(cols, tuples)` for composite PKs, but `HasManyAssociation#deleteRecords` (reached via `dependent:` strategy delete) still uses the buggy `scopeForRecords`.

## Acceptance criteria

- [ ] Replace `scopeForRecords` in `has-many-association.ts` with the tuple-safe `where(cols, tuples)` pattern (single-column stays `where({col: ids})`), matching Rails `has_many_association.rb:132–135`.
- [ ] Existing `deleteRecords` tests continue to pass.
