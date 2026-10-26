---
title: "range-size-for-index-by-enumerator"
status: draft
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ruby-compat's `Range` (`packages/ruby-compat/src/range.ts`) has no `size`, so `rbObjRespondTo(range, "size")` is false and `rbFSend(range, "size")` raises NoMethodError. MRI `range_size` (`vendor/ruby/v3.3.11/range.c:836-854`) answers `ruby_num_interval_step_size(b, e, 1, excl)` for numeric bounds, `Float::INFINITY` for a beginless/endless numeric range, else nil.

Because of this, trails#9321 could not port `assert_equal 42, (1..42).index_by.size` and `(1..42).index_with.size` from `vendor/rails/v8.0.2/activesupport/test/core_ext/enumerable_test.rb:251,267`. The `index_by`/`index_with` size block (`size if respond_to?(:size)`) is already ported in `packages/activesupport/src/enumerable-utils.ts`.

## Acceptance criteria

- [ ] `Range#size` is ported per `range.c:836`, and `basicObjRespondTo` answers it.
- [ ] The size block in `indexBy` / `indexWith` reaches it: it answers 42 for `new Range(1, 42)`.
- [ ] The two `(1..42)` assertions are added to "index by" / "index with" in `packages/activesupport/src/core-ext/enumerable.test.ts`.
