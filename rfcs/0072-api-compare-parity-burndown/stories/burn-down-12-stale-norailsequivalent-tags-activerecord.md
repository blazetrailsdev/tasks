---
title: "Burn down the 12 STALE @noRailsEquivalent tags reding parity:api:extra for activerecord"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5992
claim: "2026-08-04T15:19:08Z"
assignee: "burn-down-12-stale-norailsequivalent-tags-activerecord"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` exits 1 on a clean, fully-built tree with
12 STALE `@noRailsEquivalent` tags — tags on methods that no longer flag as extra
surface. Surfaced while gating PR #5990, which touches none of the named files,
so this is pre-existing and blocks the gate for every agent who runs it:

- `connection-adapters/schema-cache.ts` — `recordTouchedTables`,
  `takeTouchedTables`, `setPrimaryKeys`, `setDataSourceExists`, `loadAllBang`,
  `loadedCache`
- `connection-adapters/abstract/connection-pool.ts` —
  `setConnectionHandlerResolver`, `leaseConnectionSync`, `discardBangDraining`,
  `drainPendingCloses`
- `connection-adapters/sqlite3-adapter.ts` — `completeAsyncConnect`
- `base.ts` — `ensureSchemaLoaded`

Per the tool's own message, a STALE tag means one of: Rails gained the method,
the file mapping changed, the declaration is internal or `_`-prefixed (never
counted), a bare `@tag` word in the reason prose truncated it and parsed as a
real JSDoc tag, or the tag covers a moved port that belongs in its Rails-layout
file. Each of the twelve needs the cause identified before the tag is deleted —
a tag that went stale because the port MOVED is a misplaced-file finding, not a
delete.

Convergence note: `@noRailsEquivalent` is a burndown receipt, so the resolution
is per-name — delete the tag where the name now has a Rails counterpart, and
where it does not, the name is still invented surface and converging it means
removing or folding it into a ported method. Check each against its Rails file
(`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb`,
`.../abstract/connection_pool.rb`, `.../sqlite3_adapter.rb`,
`vendor/rails/activerecord/lib/active_record/base.rb` and the modules it
includes) before deciding.

## Acceptance criteria

- [ ] `pnpm parity:api:extra --package activerecord` exits 0 on a fully-built tree.
- [ ] Each of the 12 tags is either deleted (Rails counterpart exists now) or
      its name is converged away; no tag is left stale and none is re-worded to
      silence the check.
- [ ] Any tag found stale because its port is MISPLACED is filed or fixed as a
      file-layout finding, not silently deleted.
