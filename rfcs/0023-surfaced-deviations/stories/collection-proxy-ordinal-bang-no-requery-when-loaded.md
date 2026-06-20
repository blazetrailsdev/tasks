---
title: "CollectionProxy#secondBang/thirdBang/fourthBang/fifthBang re-query on loaded proxy (should read loaded target)"
status: in-progress
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3688
claim: "2026-06-20T01:12:02Z"
assignee: "collection-proxy-ordinal-bang-no-requery-when-loaded"
blocked-by: null
---

## Context

`CollectionProxy` overrides `firstBang`, `lastBang`, and `takeBang` to read from the loaded target (PR #3678, #3683). However the ordinal bang methods — `secondBang`, `thirdBang`, `fourthBang`, `fifthBang` — are still inherited from `Relation` and route through `performSecondBang` / `performThirdBang` / `performFourthBang` / `performFifthBang` in `finder-methods.ts`. These always issue a fresh query regardless of `_targetLoaded`.

Rails `has_many_associations_test.rb:580` (`test_finder_bang_method_with_dirty_target`) exercises `last!`, `third!`, `fourth!`, `fifth!` on a loaded proxy — all should read from the loaded target without re-querying.

The fix is identical to PR #3683: add `secondBang`/`thirdBang`/`fourthBang`/`fifthBang` overrides in `CollectionProxy` that delegate to `this.second()`/`this.third()`/etc. and throw `RecordNotFound` if null. Add `captureSql` / no-query assertions mirroring the `last!`/`take!` tests.

## Acceptance criteria

- [x] `CollectionProxy` overrides Rails' actual override points — `findNthWithLimit` / `findNthFromLast` (`load_target if find_from_target?; super`) — so the inherited `second!`/`third!`/`fourth!`/`fifth!` (and `secondToLast!`/`thirdToLast!`) read a loaded/dirty target without re-querying; the `perform*` finders dispatch through these instance methods. (Reviewer-driven: replaced the initial per-method bang overrides, which materialized `toArray()` and sliced, with the faithful single override point.)
- [x] `finder bang method with dirty target` test (in `HasManyAssociationsTest`) mirrors Rails `test_finder_bang_method_with_dirty_target`: builds unsaved children into an unloaded `clientsOfFirm`, asserts not loaded, then asserts exactly one query while `third!`/`fourth!`/`fifth!`/`third_to_last!`/`second_to_last!`/`last!` return them by identity.
- [x] No regression in collection-proxy / has-many suites (finder-methods, finder, associations, has-many-associations, has-many-through, delegation all pass; api:compare & test:compare non-negative).
