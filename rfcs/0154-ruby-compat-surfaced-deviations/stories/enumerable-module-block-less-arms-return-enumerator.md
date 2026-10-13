---
title: "ruby-compat: Enumerable's block-taking members answer the enumerator's elements with no block"
status: draft
updated: 2026-10-13
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The ported `Enumerable` module (`packages/ruby-compat/src/enumerable.ts`,
`export const Enumerable`) has no block-less arm on its block-taking members.
`findAll` (`enum_find_all`, `vendor/ruby/v3.3.11/enum.c:509`), `groupBy`
(`enum_group_by`, `enum.c:1157`), `map` (`enum_collect`, `enum.c:638`) and
`find` (`enum_find`, `enum.c:361`) call `block(i)` unconditionally, so a call
with no block throws a JS `TypeError` from inside `each`. Each MRI body opens
with `RETURN_ENUMERATOR` / `RETURN_SIZED_ENUMERATOR` and answers an enumerator
over the receiver's elements.

Since trails#8854 an Array reaches these through `rbFSend` and
`basicObjRespondTo` (`packages/ruby-compat/src/object.ts`, `enumerableModule`,
the port of `rb_include_module(rb_cArray, rb_mEnumerable)`,
`vendor/ruby/v3.3.11/array.c:8606`), so `rbFSend(ary, "groupBy")` and
`rbFSend(ary, "findAll")` throw where `ARRAY_METHOD_TABLE`'s own entries
(`packages/ruby-compat/src/array.ts`) answer a copy of the Array the enumerator
would yield, as the ported `each` (`rb_ary_each`, `array.c:2532`) does.

## Acceptance criteria

- [ ] `Enumerable.findAll`, `groupBy`, `map` and `find` answer, with no block,
      the Array of the elements their enumerator would yield (collected through
      `each`, so an awaiting `each` answers a promise of it).
- [ ] `packages/ruby-compat/src/array.trails.test.ts` pins
      `rbFSend(a, "groupBy")` and `rbFSend(a, "findAll")` with no block.
- [ ] `Enumerable.find` takes `ifnone` and the block in separate slots (see
      `array-detect-ifnone-lambda-read-as-block`), so its block-less arm is
      decidable.
