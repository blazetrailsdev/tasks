---
title: "Expose per-connection query_cache= setter to un-skip 'query cache lru eviction'"
status: ready
updated: 2026-07-19
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

Surfaced while merging PR #4941 (story
`query-cache-store-max-size-nullable-not-infinity`).

Rails' `query cache lru eviction` test
(`vendor/rails/activerecord/test/cases/query_cache_test.rb`) drives eviction by
swapping `connection.query_cache=` to a `Store` built with a fixed
`max_size`, then asserting the oldest entry is shifted out. trails keeps this
test **skipped** (`packages/activerecord/src/query-cache.test.ts:1013-1016`)
because it exposes **no public per-connection query-cache setter** — the only
way to seat a sized `Store` today is via pool config (`_queryCacheMaxSize`),
not per-connection.

PR #4941 hardened the eviction gate itself with trails-only unit tests
(`query-cache.trails.test.ts`, "Store max size eviction gate"), so the
behavior is covered — but the Rails-mirrored test cannot be un-skipped until a
public `connection.query_cache=` (or equivalent) setter exists, matching
Rails' `QueryCache` connection surface.

## Acceptance criteria

- [ ] Expose a per-connection query-cache setter equivalent to Rails'
      `connection.query_cache=` so a caller can seat a `Store` with a fixed
      `max_size` on an individual connection.
- [ ] Un-skip `query cache lru eviction` in `query-cache.test.ts` and make it
      pass Rails-verbatim (name unchanged).
- [ ] Read the Rails test + `abstract_adapter.rb` / `query_cache.rb` setter
      surface first; mirror the shape rather than inventing a trails-only API.
