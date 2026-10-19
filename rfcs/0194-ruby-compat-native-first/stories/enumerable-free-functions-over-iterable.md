---
title: "ruby-compat: Enumerable as free functions over any Iterable or each-answerer, absorbing array.ts and enumerable-utils.ts duplicates"
status: draft
updated: 2026-10-19
rfc: "0194-ruby-compat-native-first"
cluster: enumerable
packages: ["ruby-compat", "activesupport", "activerecord"]
deps: ["call-args-enumerable-free-function-receiver"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Enumerable is ported three ways today, and each method appears in more than one:

- `packages/ruby-compat/src/enumerable.ts:602-617` exports the `Enumerable` mixin
  object of this-typed members (`find`, `findAll`, `map`, `groupBy`, `first`,
  `drop`, `isAny`, `isOne`, `isNone`, `isInclude`, `sum`) over an `each`-answerer,
  plus `reduce` (`:548`), which takes `Each | readonly T[]`.
- `packages/ruby-compat/src/array.ts` exports Array-only `partition` (`:701`),
  `groupBy` (`:751`), `first` (`:638`), `take`, `drop`, `zip`, `toH`.
- `packages/activesupport/src/enumerable-utils.ts` exports Ruby-core methods
  (`groupBy` `:88` returning a `Map`, `tally` `:149`, `filterMap` `:158`,
  `inBatchesOf` `:117`, which is `each_slice`) next to the ActiveSupport ones
  (`indexBy`, `indexWith`, `pluck`, `maximum`, `minimum`, `many`, `compactBlank`,
  `excluding`, `sum`).

The owner chose the free-function shape (2026-10-19): `partition(enum, fn)`,
the receiver as argument 1.

## Acceptance criteria

- [ ] `packages/ruby-compat/src/enumerable.ts` exports one free function per ported `Enumerable` method, at the convention name (`partition`, `groupBy`, `eachSlice`, `minBy`, `maxBy`, `tally`, `eachWithObject`, `filterMap`, `sum`, `find`, `findAll`, `first`, `drop`). Each takes `enum: Iterable<T> | Each<T>`, iterates an Array, Set, Map (as `[k, v]` pairs), generator or `each`-answerer, follows `enum.c`'s block and early-break semantics, and returns the Ruby result type (`groupBy` and `tally` answer a `Hash`). Each carries its `vendor/ruby/v3.3.11/enum.c` citation and a `PERMANENT` receipt (README rule 2).
- [ ] Rule 1 holds: a function lands only with a real caller. The Array-only `partition` / `groupBy` in `array.ts` and the Ruby-core `groupBy` / `tally` / `filterMap` / `inBatchesOf` in `enumerable-utils.ts` are deleted and their callers moved here. Methods with no caller yet (`minBy`, `eachWithObject`, …) wait for `enumerable-free-functions-for-hand-rolled-sites`.
- [ ] Tests in `enumerable.trails.test.ts` cover each function over an Array, a Set, a Map, a generator and an `each`-answerer, plus an `each` that answers a promise.
- [ ] `pnpm parity:api:calls` is green, and `call-args-enumerable-free-function-receiver` has landed, so `:calls:args` is green too.
