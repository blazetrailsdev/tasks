---
title: "CollectionProxy#secondBang/thirdBang/fourthBang/fifthBang re-query on loaded proxy (should read loaded target)"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`CollectionProxy` overrides `firstBang`, `lastBang`, and `takeBang` to read from the loaded target (PR #3678, #3683). However the ordinal bang methods — `secondBang`, `thirdBang`, `fourthBang`, `fifthBang` — are still inherited from `Relation` and route through `performSecondBang` / `performThirdBang` / `performFourthBang` / `performFifthBang` in `finder-methods.ts`. These always issue a fresh query regardless of `_targetLoaded`.

Rails `has_many_associations_test.rb:580` (`test_finder_bang_method_with_dirty_target`) exercises `last!`, `third!`, `fourth!`, `fifth!` on a loaded proxy — all should read from the loaded target without re-querying.

The fix is identical to PR #3683: add `secondBang`/`thirdBang`/`fourthBang`/`fifthBang` overrides in `CollectionProxy` that delegate to `this.second()`/`this.third()`/etc. and throw `RecordNotFound` if null. Add `captureSql` / no-query assertions mirroring the `last!`/`take!` tests.

## Acceptance criteria

- [ ] `CollectionProxy` overrides `secondBang`, `thirdBang`, `fourthBang`, `fifthBang` to delegate to `this.second()` / `this.third()` / `this.fourth()` / `this.fifth()` and throw `RecordNotFound` if null.
- [ ] Add `captureSql` / no-query assertions for each on a loaded proxy in `has-many-associations.test.ts` mirroring Rails `test_finder_bang_method_with_dirty_target`.
- [ ] No regression in collection-proxy / has-many suites.
