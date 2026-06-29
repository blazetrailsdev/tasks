---
title: "CollectionProxy#first(n)/last(n)/take(n) should use bounded findNthWithLimit, not toArray+slice"
status: ready
updated: 2026-06-29
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
---

## Context

`CollectionProxy#first(n)` / `#last(n)` / `#take(n)` (the limit-arg case) currently
full-load the whole association via `toArray()` then `.slice(...)` in memory when
`find_from_target?` is false (collection-proxy.ts first/last/take). Rails delegates
through `find_nth_with_limit` / `find_take_with_limit`, applying `relation.limit(limit).to_a`
as a bounded query BEFORE loading (finder_methods.rb:590, :603).

This file already has the Rails-shaped bounded override `findNthWithLimit`
(collection-proxy.ts ~2874) which routes to `baseFindNthWithLimit` when not loaded.
`first(n)` and `take(n)` can delegate to `findNthWithLimit(0, n)`; `last(n)` needs the
reverse-order bounded path (base Relation `last(n)` / `findNthFromLast`).

This is a PERF-only divergence — results are correct today — and is pre-existing
(identical on origin/main before PR #4243). Not merge-blocking; deferred from PR #4243
review #8 comment 2 to keep that PR scoped to the no-arg first-caching story.

NOTE: keep the no-arg `first()`/`last()`/`take()` `_offsetMemo` (find_nth @offsets)
behavior intact — only the limit-arg path changes.

## Acceptance criteria

- [ ] `first(n)` / `take(n)` (not find_from_target) delegate to the bounded `findNthWithLimit(0, n)`
- [ ] `last(n)` (not find_from_target) uses the bounded reverse path, not full-load-and-slice
- [ ] no-arg first/last/take memoization unchanged; existing has-many / collection-proxy tests pass
