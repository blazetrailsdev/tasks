---
title: "Converge setCacheStore onto the documented foo= accessor convention"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5382
claim: "2026-07-27T01:10:54Z"
assignee: "converge-cache-store-writer-onto-accessor"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/conventions.ts:638` documents the repo-wide rule for Ruby
writers: `foo=` maps to the SAME camelCase name as the reader, i.e. a TS
setter or assignable property. `compare.ts:1645` relies on it (arity is skipped
for `foo=` pairs because the name match already proves the writer exists).

`packages/actionpack/src/abstract-controller/caching.ts` breaks that rule: the
reader is `cacheStore` and the writer is `setCacheStore`, because two exported
functions in one module cannot share a name. That deviation is what the
`setCacheStore` `@noRailsEquivalent` tag (PR #5367) documents — Rails' pair is
`ConfigMethods#cache_store` / `cache_store=`
(`vendor/rails/actionpack/lib/abstract_controller/caching.rb`).

The convergent shape is a real accessor pair installed on the host class
(`get cacheStore()` / `set cacheStore(v)`), which is also what Rails' reader and
writer actually are. Rails has 633 distinct `foo=` writers and trails has ~95
`export function setX` declarations, so the same question recurs elsewhere —
scope THIS story to `caching.ts` and record any wider pattern as a follow-up
rather than fanning out.

## Acceptance criteria

- `cacheStore` reader/writer are an accessor pair under the Rails name; the
  `setCacheStore` export and its `@noRailsEquivalent` tag are both deleted.
- Callers (`cacheConfigured`, `cache`, the actioncontroller caching wiring) and
  existing `caching.test.ts` cases pass unchanged.
- `api:compare` matches `cache_store=`; `api:extra` shows no new extras and no
  stale tags for the package.
