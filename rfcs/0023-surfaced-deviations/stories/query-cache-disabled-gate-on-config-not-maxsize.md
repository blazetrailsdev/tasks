---
title: "query-cache-disabled-gate-on-config-not-maxsize"
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

Rails asserts `@max_size` is **nil** for BOTH `query_cache: false`
(`query_cache_test.rb:157`) and `query_cache: "unlimited"` (`:175`). A nil
max size is NOT what marks a pool disabled — Rails' `QueryCache.run` gates on
`db_config&.query_cache == false`
(`connection_adapters/abstract/query_cache.rb:39`).

trails instead overloads `_queryCacheMaxSize === null` as "disabled"
(`ConnectionPoolConfiguration#queryCacheDisabled`,
`connection-adapters/abstract/query-cache.ts:255`). Because null already means
"disabled", `normalizeQueryCacheConfig` (`connection-adapters/abstract/connection-pool.ts:1467`)
cannot map `"unlimited"` to null (unbounded) and instead maps it to
`Infinity`. That forces the ported test `cache is applied when config is
string` in `packages/activerecord/src/query-cache.test.ts` to assert
`Infinity` where Rails asserts nil (documented deviation there).

## Acceptance criteria

- [ ] `queryCacheDisabled` gates on `dbConfig.queryCache === false` (Rails'
      `db_config&.query_cache == false`), not on `_queryCacheMaxSize === null`.
- [ ] `normalizeQueryCacheConfig` maps `"unlimited"` (and the fall-through raw
      string) to a null/unbounded max size, matching Rails' case fall-through
      (`query_cache.rb:122-129`), so both `false` and `"unlimited"` leave
      `_queryCacheMaxSize` null.
- [ ] Update `query-cache.test.ts` `cache is applied when config is string`
      (and `cache is not applied when config is false`) to assert null,
      Rails-verbatim, and drop the Infinity-deviation comment.
