---
title: "CollectionProxy#toArray should cache via load_target (Rails records→load_target)"
status: ready
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`CollectionProxy#toArray()` (collection-proxy.ts ~line 686) is deliberately a
cache-bypassing re-query path: it runs `merge_target_lists` but does NOT hydrate
`_target` / mark the association loaded. Rails diverges here — `CollectionProxy#records`
calls `load_target` (collection_proxy.rb:1024) and `Relation#to_a` delegates to `records`
(relation.rb:337), so Rails `to_a` marks/reuses the loaded association target.

Trails keeps the re-query path because two gaps surface as stale-cache reads once
`toArray` caches (both documented in the method comment):

1. bang mutations (`whereBang`/etc.) must re-query with the mutated scope without
   hydrating the association cache (now partly addressed by `_offsetMemo` clearing,
   but `toArray` caching would reintroduce the issue);
2. `_deleteThrough` looks up join rows with a scalar-PK read, so for composite-PK
   target models it can't prune destroyed records from a cached `_target` — re-querying
   masks this today.

Converging `toArray` onto Rails' `load_target` hydration is gated on fixing (2).
Note `reflection.test.ts` (`scope chain does not interfere with hmt...`) relies on the
current non-caching behavior via an external `deleteAll` + re-read; converging will
require that test to use association-based clearing / reload to match Rails.

Reviewer reference: Copilot review #7 comment on PR #4243.

## Acceptance criteria

- [ ] `_deleteThrough` prunes composite-PK target records from a cached `_target`
- [ ] `toArray()` hydrates `_target` / marks loaded (Rails `records → load_target`)
- [ ] `reflection.test.ts` hmt scope-chain tests converge to Rails' clearing/reload pattern
- [ ] `strict-loading` / external-mutation visibility semantics preserved or converged to Rails
