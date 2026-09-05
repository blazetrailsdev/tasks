---
title: "schemaCache resolves a class-assigned adapter where Rails is always pool-resolved"
status: draft
updated: 2026-09-05
rfc: "0073-permanent-connection-checkout-disallowed"
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

`schemaCache` (`packages/activerecord/src/connection-handling.ts:446-450`) opens
with a directly-assigned-adapter short-circuit before falling through to the
pool:

```ts
export function schemaCache(this: typeof Base) {
  const directAdapter = (this as any)._adapter;
  if (directAdapter) return directAdapter.schemaCache;
  return connectionPool.call(this).schemaCache;
}
```

Rails' `schema_cache`
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb:368-370`)
is `pool.schema_cache` and nothing else — there is no "bare adapter, no pool"
concept in Rails, so the whole arm is trails-only.

Added by #7535, which converged `InsertAll::Builder#extractTypesFromColumnsOn`
onto Rails' `@model.schema_cache.columns_hash(table_name)`
(`insert_all.rb:307`). That read previously went through a prewarmed snapshot
built from `connection.schemaCache`, so it never touched the pool;
`core.trails.test.ts > insertAll resolves through the assigned adapter without
a pool` failed on all three adapter lanes without the arm.

It is the THIRD row of the same register, not a new shape — `connection()`
(`:363-364`) and `adapterClassSync()` (`:390-393`) already carry the identical
`_adapter` short-circuit — and it is the same finding
`uniqueness-table-indexes-resolves-a-class-assigned-adapter` records for
`tableIndexes` (filed against the retired 0023 bucket).

## Converged shape

The arm goes away when `Model.adapter = x` does, which is what
`retire-direct-adapter-with-connection-shim` covers: every caller resolves
through a pool, `schemaCache` is `connectionPool.call(this).schemaCache` alone,
and the `core.trails.test.ts` fixture pattern that needs a pool-less model is
replaced by a real pool. Converge this row as part of that retirement rather
than on its own — removing it in isolation just reds the same test again.

## Acceptance criteria

- [ ] `schemaCache` reads `connectionPool.call(this).schemaCache` with no
      `_adapter` arm, matching `connection_handling.rb:368-370`.
- [ ] `core.trails.test.ts > insertAll resolves through the assigned adapter
without a pool` is either converged onto a pooled model or removed with
      the fixture pattern it exercises.
- [ ] The sibling `_adapter` arms on `connection()` and `adapterClassSync()`
      are addressed by the same retirement, so no row of the register is left
      behind.
