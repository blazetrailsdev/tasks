---
title: "Native filter / Set / includes / join for compact / uniq / union / flatten / aryIncludes / aryJoin / aryCount over primitive elements"
status: in-progress
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: native-sweep
packages: ["actionpack", "activemodel", "activerecord"]
deps: ["native-analogues-array-calls", "ruby-compat-native-required-lint"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9347
claim: "2026-10-26T18:48:09Z"
assignee: "native-array-set-op-sites"
blocked-by: null
closed-reason: null
---

## Context

The Array set and filter helpers in `packages/ruby-compat/src/array.ts`
(`compact` `:872`, `compactBang` `:883`, `uniq` `:987`, `union` `:1028`,
`flatten` `:956`, `aryIncludes` `:1010`, `aryJoin` `:1087`, `aryCount` `:684`)
have these importing non-test files outside ruby-compat: `compact` 10
(`action-controller/metal/rate-limiting.ts`, `relation.ts`,
`type/hash-lookup-type-map.ts`, …), `union` 9 (`counter-cache.ts`,
`readonly-attributes.ts`, `serialization.ts`, `touch-later.ts`, …), `uniq` 4
(`journey/path/pattern.ts`, `associations/preloader/batch.ts`,
`abstract/transaction.ts`, …), `flatten` 3, `aryJoin` 3, `compactBang`,
`aryIncludes` and `aryCount` 1 each.

`uniq`, `union` and `aryIncludes` compare by `eql?` / `hash` / `==`
(`array.c`'s `ary_make_hash`, `rb_equal`). For a primitive element that is
`Set` / `includes` identity, but not for a record, an Array or a `BigDecimal`.

## Acceptance criteria

- [ ] A site whose element type is primitive (`string`, `number`, `bigint`, `boolean`, `null`) uses the native form from `native-analogues-array-calls`. A site whose elements are objects keeps the helper, and the PR lists it with the element type.
- [ ] `aryJoin` stays where an element can be `null` or a nested Array (Ruby renders `nil` as `""` and flattens recursively, `array.c:2894`). It is native elsewhere.
- [ ] Each converted helper joins `eslint/ruby-compat-native-required.json`, and any export left with no caller is deleted.
- [ ] Call gates green, no new baseline rows.
