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

The no-arg path has the same shape: `first()`/`take()` populate `_offsetMemo` from
`toArray()[0]` (full load + index) rather than Rails' bounded `find_nth_with_limit(0, 1)`
(`ordered_relation.limit(1).to_a`, finder_methods.rb:598,:603) / `find_take`
(`limit(1).records.first`, finder_methods.rb:582); no-arg `last()` similarly full-loads
instead of Rails' `reverse_order` finder (finder_methods.rb:202). The memoized VALUE is
correct (same object cached) — only the underlying query is unbounded.

This is a PERF-only divergence — results are correct today — and is pre-existing
(identical on origin/main before PR #4243). Not merge-blocking; deferred from PR #4243
reviews #8 comment 2 and #10 to keep that PR scoped to the no-arg first-caching story.

NOTE: keep the no-arg `first()`/`take()` `_offsetMemo` (find_nth @offsets / find_take @take)
memoization SEMANTICS intact — only swap the underlying query from `toArray()` to the
bounded finder. `last()` already does not memoize (matches Rails).

## Acceptance criteria

- [ ] `first(n)` / `take(n)` (not find_from_target) delegate to the bounded `findNthWithLimit(0, n)`
- [ ] `last(n)` (not find_from_target) uses the bounded reverse path, not full-load-and-slice
- [ ] no-arg `first()` / `take()` populate `_offsetMemo` from the bounded finder, not `toArray()[0]`
- [ ] no-arg memoization semantics unchanged; existing has-many / collection-proxy / named-scoping tests pass
