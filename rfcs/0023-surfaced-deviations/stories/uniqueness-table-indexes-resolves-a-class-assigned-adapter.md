---
title: "tableIndexes resolves a class-assigned adapter where Rails is always pool-resolved"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`covered_by_unique_index?` reads its index list off `klass.schema_cache`
(`activerecord/lib/active_record/validations/uniqueness.rb:88`), and
`schema_cache` is unconditionally **pool-resolved** in Rails —
`connection_pool.schema_cache`
(`activerecord/lib/active_record/connection_handling.rb:368-370`). A Rails class
has no way to carry a connection that did not come from its pool, so there is
exactly one resolution path.

trails' counterpart, `tableIndexes` in
`packages/activerecord/src/validations/uniqueness.ts:449-464`, resolves three
different ways instead:

```ts
const adapter = threadedConnectionFor(klass) ?? klass?.connection;
...
const cache = adapter.schemaCache;
if (!cache || typeof cache.indexes !== "function") return [];
```

- `threadedConnectionFor(klass)` — no Rails counterpart at this call site.
- `klass.connection` — honours a class-level **directly assigned** `_adapter`,
  which Rails has no notion of.
- the `typeof cache.indexes !== "function"` duck-type silently returns `[]`
  rather than raising, so a mis-resolved cache turns the optimization off
  invisibly instead of failing.

The directly-assigned arm is what
`UniquenessCoveredByUniqueIndexAdapterResolutionTest`
(`packages/activerecord/src/validations/uniqueness-validation.trails.test.ts:83`)
exists to cover, and its own comment states the deviation outright: "Rails has
no counterpart — its `klass.schema_cache` is always pool-resolved."

Surfaced while fixing the `:memory:` red in #7111 (that PR fixed only the
missing table, and deliberately did not touch this).

## Converged shape

`tableIndexes` reads `klass.schemaCache.indexes(klass.tableName)` — pool-resolved,
one path, no duck-type fallback — mirroring uniqueness.rb:88 directly. The
`?? klass.connection` and `typeof cache.indexes` arms go away, and the silent
`return []` with them.

Retiring the directly-assigned arm removes the only reason
`UniquenessCoveredByUniqueIndexAdapterResolutionTest` needs a second pool and a
`rebuildCanonicalTables` call; see the sibling story under
0079-drop-rebuild-canonical-tables.

## Acceptance criteria

- `tableIndexes` resolves the schema cache pool-side only, per
  connection_handling.rb:368-370.
- The `threadedConnectionFor` / `klass.connection` / duck-type fallbacks are
  gone, or each surviving one carries a call-site justification naming a
  genuine TypeScript shortcoming.
- No new baseline row, no `@noRailsEquivalent` added to keep a fallback.
- `UniquenessCoveredByUniqueIndexAdapterResolutionTest` either converges onto
  the pool-resolved path or is retired with its coverage moved; the two
  behavioural assertions (zero-query unchanged attribute, one-query changed
  attribute) survive either way.
- Green on all lanes including `ARCONN=sqlite3_mem`.
