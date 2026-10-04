---
title: "ruby-compat: the block marker and the ownMethod probe cost about a quarter of a materializing attribute read"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the CPU profile in trails#8472 (30,000 `Topic` rows, 18 columns). With the attribute
set materialized, ruby-compat's Hash helpers were about a quarter of all samples, by self time:

- `block` (`packages/ruby-compat/src/hash.ts`, the `&block` marker): 5.7%. Every call allocates a
  wrapper closure, runs `Object.defineProperty(blk, "length", ...)` and `Object.assign(blk, { [BLOCK]: true })`.
  `LazyAttributeSet#fetchValue` and `#defaultAttribute` (`packages/activemodel/src/attribute-set/builder.ts`)
  build one or two per attribute read, mirroring `values.fetch(name) { value_present = false }`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:41-72`).
- `ownMethod` (the `isKey` / `keys` / `fetch` receiver dispatch): 5.3%, a `getPrototypeOf` plus a property read on every `hashAref` / `hasKey` / `fetch` / `keys`.
- `keys` 4.2%, `hashAref` 4.0%, `hasKey` 2.7%, `fetch` 1.5%, `hashAset` 1.6%.

trails#8472 took these off the record-load path by not materializing, but every attribute read
through `LazyAttributeSet` still pays them. Rails reads all attributes of 10,000 such records in
about 650 ms on the same machine; trails' figure is not measured yet.

## Expected shape

`block` marks without a wrapper allocation and two property definitions per call, and the plain
object / `Map` receivers reach their arm without the `ownMethod` probe. Behaviour is unchanged:
`rbBlockGivenP`, the `length` a block reports, and the `isKey` / `keys` / `fetch` dispatch on a
non-Hash receiver (`ActiveRecord::Result::IndexedRow`) all stay.

## Acceptance criteria

- [ ] A benchmark of `Topic.all().toArray()` followed by reading every attribute of 10,000 rows is recorded before and after, next to Rails' 650 ms.
- [ ] `block` and `ownMethod` each fall below 1% of samples in that profile.
- [ ] ruby-compat's hash tests pass unchanged.
