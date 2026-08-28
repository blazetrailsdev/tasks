---
title: "Remove the rebuildCanonicalTables shield from the uniqueness adapter-resolution test"
status: closed
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Premise gone: PR #7114 (e4889f2cb, 2026-08-27) gave UniquenessCoveredByUniqueIndexAdapterResolutionTest its own bespoke direct_subscribers table on the raw pool instead of the rebuildCanonicalTables(adapter, ["subscribers"]) call #7111 had added. Verified on origin/main: git grep -n rebuildCanonicalTables packages/activerecord/src/validations/uniqueness-validation.trails.test.ts returns nothing, and the file is absent from eslint/rebuild-canonical-tables-callers.json. The raw checkoutRawTestAdapter pool survives at :104 by design (the story''s own AC allows it); retiring that resolution arm is tracked by uniqueness-table-indexes-resolves-a-class-assigned-adapter under RFC 0023.'
---

## Context

PR #7111 added a new `rebuildCanonicalTables` call site — the shape this RFC
exists to eliminate — in
`packages/activerecord/src/validations/uniqueness-validation.trails.test.ts:104-106`:

```ts
if (!(await adapter.tableExists("subscribers"))) {
  await rebuildCanonicalTables(adapter, ["subscribers"]);
}
```

It is the narrowest form of the shield: guarded on absence, so it fires only on
the `sqlite3_mem` lane, where `checkoutRawTestAdapter` builds a pool over a
private `:memory:` database that no other file can see. On every file-backed
lane the guard is false and nothing runs. That is why it was acceptable as a
red-fix — but it is still a caller, still counts against
`ratchet-rebuild-canonical-tables-callers`, and still has to go before
`delete-rebuild-canonical-tables` can land.

Rails has no counterpart: its suite is one process against one database, so no
test ever relays a subset of `schema.rb`.

## Converged shape

The call site exists only because `UniquenessCoveredByUniqueIndexAdapterResolutionTest`
needs a **second** connection — it assigns `DirectSubscriber._adapter` directly
to prove `tableIndexes` honours a class-assigned adapter, and the assertion is
vacuous if that adapter is the ambient one. So the second pool, the private
`:memory:` database, and the `CREATE TABLE` all follow from a trails-only
resolution path.

Two ways out, in preference order:

1. **Retire the arm.** Converge `tableIndexes` onto Rails' pool-resolved
   `klass.schema_cache` (`connection_handling.rb:368-370`) — filed as
   `uniqueness-table-indexes-resolves-a-class-assigned-adapter` under
   0023-surfaced-deviations. The describe then has nothing trails-only left to
   cover and the whole raw-pool block goes with it.
2. **Move the coverage down.** If the arm survives, cover `tableIndexes`
   directly with a stub adapter and no database at all, which removes the pool
   and the DDL without touching the resolution path.

Either way the file ends with zero `rebuildCanonicalTables` calls and zero raw
pools.

## Acceptance criteria

- No `rebuildCanonicalTables` import or call in
  `uniqueness-validation.trails.test.ts`.
- `checkoutRawTestAdapter` / the `beforeAll`+`afterAll` pool lifecycle in
  `UniquenessCoveredByUniqueIndexAdapterResolutionTest` are gone with it, or the
  story explains why the pool outlives the shield.
- The two behavioural assertions survive: zero queries for an unchanged
  index-covered attribute, one query for a changed one.
- Green on all lanes including `ARCONN=sqlite3_mem` — that lane is the only one
  the removed call was serving, so it is the one that proves the removal.
