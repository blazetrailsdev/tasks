---
title: "Remove redundant manual clearCacheBang workarounds now that defineSchema clears the PG cache"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 40
pr: 3891
claim: "2026-06-22T16:27:56Z"
assignee: "remove-redundant-clearcachebang-workarounds"
blocked-by: null
---

## Context

PR #3519 made `defineSchema`/`_defineSchemaImpl` call `adapter.clearCacheBang?.()`
after any DROP/CREATE DDL (mirroring Rails `clear_cache!` reset semantics), so the
manual prepared-statement-cache flush workarounds in test files are now redundant.

Two remaining manual workarounds were not removed in #3519 (kept that PR scoped to
`has-many-associations.test.ts`):

- `packages/activerecord/src/associations.test.ts:4537-4539` — `beforeAll`
  calling `(Base.connection as { clearCacheBang?... }).clearCacheBang?.()`.
- `packages/activerecord/src/calculations.test.ts:7413-7415` — same pattern.

Both run after `useHandlerFixtures`' own `beforeAll` rebuilds canonical tables, so
the `defineSchema` cache-clear now covers them.

## Acceptance criteria

- [ ] Remove the manual `clearCacheBang()` `beforeAll` from `associations.test.ts`
      and `calculations.test.ts` (plus their explanatory comments).
- [ ] Verify both files pass on postgres (`ARCONN=postgres`) without the manual call.
