---
title: "Move activesupport's Ruby-core minBy / maxBy / eachCons into ruby-compat Enumerable free functions"
status: done
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9296
claim: "2026-10-25T00:21:00Z"
assignee: "claude-md-module-mixins-section-contradicts-itself"
blocked-by: null
closed-reason: null
---

## Context

trails#9269 moved the Ruby-core Enumerable methods `groupBy`, `tally`, `filterMap`, `eachSlice` and `inBatchesOf` out of `packages/activesupport/src/enumerable-utils.ts` and into free functions in `packages/ruby-compat/src/enumerable.ts`. Three Ruby-core methods are still in activesupport as Array-only helpers:

- `minBy` / `maxBy`: `vendor/ruby/v3.3.11/enum.c` `enum_min_by` / `enum_max_by`. The helpers answer `undefined` for an empty receiver where Ruby answers `nil`. They also have no `n` arm.
- `eachCons`: `enum_each_cons`. The helper does not raise `ArgumentError "invalid size"` for a size that is not positive.

None of these is an ActiveSupport core_ext. Rails' `active_support/core_ext/enumerable.rb` defines none of them.

## Acceptance criteria

- [ ] `minBy`, `maxBy` and `eachCons` are free functions in `packages/ruby-compat/src/enumerable.ts`. Each takes `obj: Iterable<T> | Each<T, E>`, follows its `enum.c` body (`nil` for an empty receiver, the size guard), and carries an `enum.c` citation and a `PERMANENT` receipt.
- [ ] The activesupport copies and their `index.ts` exports are deleted, and their callers import from `@blazetrails/ruby-compat`.
- [ ] Tests in `enumerable.trails.test.ts` cover each function over an Array, a Set, a generator and an `each`-answerer.
