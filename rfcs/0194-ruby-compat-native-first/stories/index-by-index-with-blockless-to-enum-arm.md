---
title: "index-by-index-with-blockless-to-enum-arm"
status: draft
updated: 2026-10-24
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

`indexBy` (`packages/activesupport/src/enumerable-utils.ts`) always requires its
block. Rails' `Enumerable#index_by`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:52-60`)
answers `to_enum(:index_by) { size if respond_to?(:size) }` when no block is
given, and `index_with` (`:75-87`) does the same in its `no_default` arm. The
trails free functions have no blockless arm. ruby-compat's `toEnum`
(`packages/ruby-compat/src/enumerator.ts:160`) builds an `Enumerator` that
dispatches `meth` on the receiver, so a free function needs a dispatchable
`indexBy` / `indexWith` on that receiver. Surfaced in review of trails#9285.

## Acceptance criteria

- [ ] `indexBy(collection)` with no block answers an Enumerator that yields the elements, and whose `each` with a block builds the index, as `to_enum(:index_by)` does.
- [ ] `indexWith(collection)` with no default and no block does the same.
- [ ] Port the matching Rails assertions from `activesupport/test/core_ext/enumerable_test.rb` (`test_index_by`, `test_index_with`).
