---
title: "Clear the 12 stale @noRailsEquivalent tags failing parity:api:extra"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5992
claim: "2026-08-03T17:19:42Z"
assignee: "clear-stale-norailsequivalent-tags"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra` currently fails with 12 STALE `@noRailsEquivalent` tags —
methods that no longer flag as extra surface, so the tag is dead metadata the
gate rejects. Observed while working PR #5975 (the gate was already red on
`main`; none of these are in the files that PR touched).

The 12, as reported by `parity:api:extra`:

- `connection-adapters/schema-cache.ts` — `recordTouchedTables`,
  `takeTouchedTables`, `setPrimaryKeys`, `setDataSourceExists`, `loadAllBang`,
  `loadedCache`
- `connection-adapters/abstract/connection-pool.ts` —
  `setConnectionHandlerResolver`, `leaseConnectionSync`, `discardBangDraining`,
  `drainPendingCloses`
- `connection-adapters/sqlite3-adapter.ts` — `completeAsyncConnect`
- `base.ts` — `ensureSchemaLoaded`

Per the tool's own message, a tag goes stale because Rails gained the method,
the file mapping changed, the declaration is internal or `_`-prefixed (never
counted), a bare `@tag` word inside the reason prose truncated the reason and
was parsed as a real JSDoc tag, or the tag covers a moved port that belongs in
its Rails-layout file.

Rails anchors for the two densest files:
`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb`
and
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`.

## Acceptance criteria

- For each of the 12, determine WHY it went stale before touching it. A tag
  that went stale because the member is now `_`-prefixed or `@internal` is a
  plain tag deletion; a tag that went stale because the reason prose swallowed
  a bare `@word` is a prose fix (the member is still extra surface and still
  needs its reason); a tag on a moved port means the port belongs in its
  Rails-layout file.
- Delete or repair each tag accordingly — do NOT blanket-delete to green the
  gate, and do not allowlist.
- `pnpm parity:api:extra` exits 0.
