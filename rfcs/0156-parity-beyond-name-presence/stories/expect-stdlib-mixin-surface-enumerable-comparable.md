---
title: "Expect Enumerable / Comparable surface from a class that includes them"
status: ready
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`flattenIncludedMethodInfos` skips modules outside the package, naming the case in its own doc: "stdlib like `Comparable`/`Enumerable` falls through" (`scripts/api-compare/compare.ts:2633-2634`). `ActiveModel::Errors` is `include Enumerable` (`vendor/rails/activemodel/lib/active_model/errors.rb:41`), so `map`, `first` and block-form `any?` are public Rails API that nothing expects. 0155's `activemodel-errors-does-not-include-enumerable` found it through three parked tests, and `errors-inspect-test-spells-first-as-objects-index` is the workaround it caused.

`scripts/api-compare/enumerable-idioms.ts` already holds the Ruby-to-JS spelling table for these idioms on the call side.

## Acceptance criteria

- For a class that includes `Enumerable` and defines `each`, the comparer reports whether the TS class is iterable or mixes in a ruby-compat Enumerable, and lists it when neither holds.
- Same for `Comparable` and `<=>`.
- `ActiveModel::Errors` is listed.
- Report-only, one row per class, never one row per Enumerable method.
