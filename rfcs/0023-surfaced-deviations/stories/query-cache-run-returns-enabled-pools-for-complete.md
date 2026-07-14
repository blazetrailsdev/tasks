---
title: "query-cache-run-returns-enabled-pools-for-complete"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of the multi-role query-cache test port (PR #4850,
story `query-cache-multi-role-connected-to-tests`).

Rails' `QueryCache.run` RETURNS the pools it enabled, and the executor threads
that exact list into `complete(pools)`
(`connection_adapters/abstract/query_cache.rb:37-49`). A pool with
`query_cache: false` is skipped by `run` and therefore never touched by
`complete`.

trails' `QueryCache.installExecutorHooks`
(`packages/activerecord/src/query-cache.ts:128-137`) re-resolves the pool list
independently in both `run` and `complete`, so `complete` calls
`disableQueryCacheBang` + `clearQueryCache` on pools that `run` skipped
(e.g. a `query_cache: false` reading pool in the ported
`cache is not applied when config is false` test). Harmless today but a
behavioral divergence.

## Acceptance criteria

- [ ] `QueryCache.run` returns the list of pools it enabled.
- [ ] `installExecutorHooks` threads `run`'s result into `complete` so
      `complete` only disables/clears pools that `run` enabled.
- [ ] `QueryCache.complete` no longer touches config-disabled pools.
