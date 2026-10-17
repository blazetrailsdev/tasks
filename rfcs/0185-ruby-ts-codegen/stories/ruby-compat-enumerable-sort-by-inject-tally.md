---
title: "ruby-compat ports sort_by, sort_by!, inject, each_with_object and tally"
status: draft
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The codegen generator lowers several Enumerable methods through generated-runtime shim helpers (`scripts/codegen/src/runtime-shim.ts`): `sortBy`, `sortByBang`, `inject`, `eachWithObject` and `tally`. The repo owner ruled that no generated runtime ships. Each of these carries Ruby semantics that a native one-liner does not:

- `Enumerable#sort_by` (`vendor/ruby/v3.3.11/enum.c:1651`) and `Array#sort_by!` (`array.c:3593`) compare keys with `<=>`, which ruby-compat's `cmp` ports, and sort stably;
- `Enumerable#inject` (`enum.c:1005`) takes a Symbol or a block, with or without an initial value, and an empty receiver without one answers `nil`;
- `Enumerable#each_with_object` (`enum.c:3285`) yields `[key, value]` for a Hash and answers the memo;
- `Enumerable#tally` (`enum.c:1229`) keys by the element itself (`Hash.new(0)`), not by its string form. activesupport's `tally` keys by `String(x)` and is wrong for a class.

## Acceptance criteria

- [ ] ruby-compat exports ports of these five at MRI's names, each with its `enum.c` / `array.c` citation, over an Array, a Hash (pairs), a Map and a Set, with tests for every arm listed above.
- [ ] The generator emits the ruby-compat call for these and deletes the shim entries. A receiver the generator types as an Array, where the native form is the same operation (`reduce` with an initial value, say), gets the native form (RFC 0194).
