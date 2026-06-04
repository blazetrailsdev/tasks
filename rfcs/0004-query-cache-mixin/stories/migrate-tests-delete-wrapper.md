---
title: "Phase 3 — migrate tests, delete the wrapper, collapse .inner walks"
status: done
rfc: "0004-query-cache-mixin"
cluster: query-cache
deps: ["pool-based-query-cache"]
deps-rfc: []
est-loc: 250
pr: 2684
claim: null
assignee: null
blocked-by: null
---

## Context

With the mixin caching (Phase 1) and `cache`/`uncached` relocated (Phase 2), the
`QueryCacheAdapter` wrapper can be retired and the `.inner` adapter walks
collapsed to direct static lookups.

See RFC 0004 §Design (Phase 3).

## Acceptance criteria

- [ ] `query_cache_test.rb`-matched tests migrated from
      `new QueryCacheAdapter(inner)` to the mixin adapter, **names verbatim**
- [ ] Wrapper-only tests with no Rails counterpart (Quoting-forwarder fallbacks)
      deleted with the wrapper
- [ ] `QueryCacheAdapter` + private helpers (`castBinds`,
      `getCurrentUserTransaction`, `cacheKey`) deleted; export dropped from
      `index.ts` (note the public-API removal in the PR body)
- [ ] `.inner` walks collapsed to direct static lookups
      (`adapter.constructor.columnNameMatcher?.() ?? abstractColumnNameMatcher()`)
      in `resolveColumnNameMatcher` / `resolveColumnNameWithOrderMatcher`
      (`relation.ts`) and `resolveOrderMatcher` (`relation/query-methods.ts`)
- [ ] Stale `QueryCacheAdapter` comment removed from `relation.ts`

## Notes

Use the **live** `pnpm test:compare` for the baseline (54 OK / 13 skipped at
writing) — NOT the stale `activerecord-test-compare-100.md` snapshot
(2026-05-18). Subsumes the closed column-matcher dedup PR #2639; do not reopen it
standalone (no wrapper → no `.inner` chain → resolvers collapse to one-liners).
`resolveAdapterMatcher` from #2639 is NOT on main — the three resolvers above are
the real symbols.
