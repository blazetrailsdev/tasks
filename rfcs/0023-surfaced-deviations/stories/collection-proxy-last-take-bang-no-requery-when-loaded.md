---
title: "CollectionProxy#lastBang/takeBang re-query on loaded proxy (should read loaded target)"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-19T23:54:11Z"
assignee: "collection-proxy-last-take-bang-no-requery-when-loaded"
blocked-by: null
---

## Context

`CollectionProxy#last` and `#take` now correctly check `isFindFromTarget()` and
`loadTarget()` before reading `_target` (fixed in PR #3678). However `lastBang`
and `takeBang` are inherited from `Relation` and route through `performLastBang`
→ `performLast` and `performTakeBang` → `performTake` (finder-methods.ts:376, 408) — these functions bypass CP's overridden `last`/`take` and always issue a
fresh query regardless of `_targetLoaded`.

This is the same pattern `firstBang` had before PR #3678: the fix was to add a
`firstBang` override in `CollectionProxy` that delegates to `this.first()` and
throws `RecordNotFound` if null. The same override pattern is needed for
`lastBang` and `takeBang`.

Rails reference: `FinderMethods#last!` / `#take!`
(activerecord/lib/active_record/relation/finder_methods.rb) delegate to
`last`/`take`, which in CP goes through `load_target if find_from_target?; super`
— so Rails naturally reads from the loaded target.

## Acceptance criteria

- [ ] `CollectionProxy#lastBang` overrides the inherited `performLastBang` path,
      delegating to `this.last()` and throwing `RecordNotFound` if null.
- [ ] `CollectionProxy#takeBang` overrides the inherited `performTakeBang` path,
      delegating to `this.take()` and throwing `RecordNotFound` if null.
- [ ] Add `captureSql` / no-query assertions for `last!` and `take!` on loaded
      proxies in `associations.test.ts` (mirroring the `first!` test from
      associations_test.rb:631).
- [ ] No regression in collection-proxy / has-many suites.
