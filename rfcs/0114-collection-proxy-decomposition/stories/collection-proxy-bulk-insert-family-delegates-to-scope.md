---
title: "insert*/upsert* overrides and the invented bulk-insert guard shadow the delegate-to-scope table"
status: claimed
updated: 2026-08-19
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["collection-proxy-initialize-is-five-lines"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-08-19T23:26:39Z"
assignee: "split-future-result-scheduled-dispatch-out-of-exec-queries"
blocked-by: null
closed-reason: null
---

## Context

Rails routes `:insert, :insert_all, :insert!, :insert_all!, :upsert,
:upsert_all` (plus `:scoping, :values, :load_async`) to `scope` through the
`delegate_methods` list
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`).
It writes no override for any of them.

`packages/activerecord/src/associations/collection-proxy.ts:1071-1124` writes
six — `insert`, `insertBang`, `insertAll`, `insertAllBang`, `upsert`,
`upsertAll`, **38 code lines** — each of the shape:

```ts
async insertAll(...args: Parameters<Relation<T>["insertAll"]>) {
  this._assertBulkInsertable();
  return super.insertAll(...args);
}
```

Two divergences in one body. First, `super.X` runs the inherited `Relation`
method against the proxy's **own** seeded relation state, where Rails runs it
against `scope` — the association's relation. Second, `_assertBulkInsertable`
(`:1063`, 7 lines) and its helper `_reflectionForeignKey` (`:1051`, 3) are an
invented guard: Rails has no such check on a `CollectionProxy`, and
`parity:api:extra` counts all six names as moved (they belong to `relation.rb` /
`querying.rb`), which is exactly the fingerprint of an override Rails does not
write.

`setIds` (`:2124`, 7) is the sixth of this file's six **novel** names; Rails'
spelling is `ids_writer`, delegated to the association
(`collection_association.rb:62-85`), and trails already has
`CollectionAssociation#idsWriter` at
`packages/activerecord/src/associations/collection-association.ts:290`.

## Converged shape

Delete all six overrides plus `_assertBulkInsertable` and
`_reflectionForeignKey`; the names reach `scope` through the existing delegate
table at `collection-proxy.ts:2849-2872`, where Rails already puts them (the
extra-name list there already contains `insert`, `insertAll`, `insertBang`,
`insertAllBang`, `upsert`, `upsertAll` — the overrides are what shadow it).

`setIds` takes the Rails name `idsWriter` and delegates.

If a test proves the bulk-insert guard is load-bearing, that is evidence the
`scope` the delegation reaches is wrong — fix the scope, or file the finding;
do not keep the guard.

## Acceptance criteria

- `insert`, `insertBang`, `insertAll`, `insertAllBang`, `upsert`, `upsertAll`,
  `_assertBulkInsertable`, `_reflectionForeignKey` no longer exist in
  `collection-proxy.ts`; the six names resolve through the delegate table.
- `setIds` is gone; the surface is `idsWriter`, delegating to the association.
  Update every in-repo caller in the same PR.
- `pnpm parity:api:extra --package activerecord` shows the moved count for
  `associations/collection-proxy.ts` drop by at least 6, and the novel count
  drop by 1.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
- Existing suites pass unchanged, incl. `constructor-form-and-hmt-insert.test.ts`
  and `has-many-associations.test.ts`. No test renamed.
