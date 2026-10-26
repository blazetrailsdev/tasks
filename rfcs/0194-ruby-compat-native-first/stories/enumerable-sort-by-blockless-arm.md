---
title: "ruby-compat: Enumerable#sortBy answers its elements without a block (enum_sort_by RETURN_SIZED_ENUMERATOR)"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9329
claim: "2026-10-26T14:48:26Z"
assignee: "create-with-value-and-finder-conditions-native-empty"
blocked-by: null
closed-reason: null
---

## Context

`sortBy` in `packages/ruby-compat/src/enumerable.ts` (the free function and the `Enumerable#sortBy` member trails#9292 added) requires a block. Ruby's `enum_sort_by` (`vendor/ruby/v3.3.11/enum.c`, under `Init_Enumerable` :5047) starts with `RETURN_SIZED_ENUMERATOR`, so calling it without a block answers an enumerator. `partition` and `reject` already handle the blockless case by answering `enumToA(obj)`.

## Acceptance criteria

- [ ] When `sortBy(obj)` and `new Enumerable(xs).sortBy()` get no block, they answer `enumToA(obj)`, the same shape `partition` and `reject` use.
- [ ] A test in `enumerable.trails.test.ts` covers the blockless call.
