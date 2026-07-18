---
title: "QueryCache Store max size should be nullable (unbounded), not a number sentinel"
status: ready
updated: 2026-07-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while merging PR #4932 (story
`query-cache-disabled-gate-on-config-not-maxsize`).

Rails' `QueryCache::Store` (`connection_adapters/abstract/query_cache.rb:34-92`)
holds a **nullable** `@max_size`: `nil` means unbounded and eviction is gated
by `if @max_size && @map.size >= @max_size` (`:75`). trails' `Store`
(`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:29-106`)
instead types `_maxSize` as a plain `number`, treats `<= 0` as "disable
storage", and has no native representation of unbounded.

PR #4932 papered over the gap at the call site: `get queryCache()`
(`query-cache.ts:319-324`) maps a null pool max size to
`Number.POSITIVE_INFINITY` so the number-typed Store never evicts. That is a
faithful _result_ but a deviation in the Store's shape — a raw `new Store(v,
Infinity)` reads as a magic sentinel where Rails passes `nil`.

## Acceptance criteria

- [ ] `Store#_maxSize` becomes `number | null`, `nil`/null meaning unbounded,
      matching Rails.
- [ ] Eviction gates on `this._maxSize != null && this._map.size >=
this._maxSize` (Rails `query_cache.rb:75`); drop the `<= 0` sentinel.
- [ ] `get queryCache()` passes `this._queryCacheMaxSize` straight through
      (null → null), removing the `?? Number.POSITIVE_INFINITY` shim.
- [ ] Existing query-cache.test.ts assertions stay Rails-verbatim (null for
      false/unlimited, integer for a sized config).
