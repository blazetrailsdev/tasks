---
title: "ruby-compat: Enumerable carries group_by, and the Array table drops its groupBy entry"
status: in-progress
updated: 2026-10-13
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8854
claim: "2026-10-13T13:47:53Z"
assignee: "enumerable-module-carries-group-by"
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/array.ts` `ARRAY_METHOD_TABLE` (trails#8854) holds a
`groupBy` entry that forwards to the ported `groupBy(ary, block)` in the same
file (`enum_group_by`, `vendor/ruby/v3.3.11/enum.c:1157`). No trails code sends
`group_by` to an Array: the entry exists so an Array answers
`respond_to?(:group_by)`, which
`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb:16`
asks of `Comment.all.records`.

In Ruby an Array answers `group_by` because `rb_cArray` includes
`rb_mEnumerable` (`vendor/ruby/v3.3.11/array.c:8606`) and `Init_Enumerable`
defines it (`enum.c:5087`). trails#8854 ported that inclusion: `rbFSend` and
`basicObjRespondTo` (`packages/ruby-compat/src/object.ts`, `enumerableModule`)
fall through to the ported `Enumerable` object
(`packages/ruby-compat/src/enumerable.ts`, `export const Enumerable`), which is
how `find_all`, `none?` and `one?` are answered with no table entry.
`Enumerable` has no `groupBy` member.

`Relation#groupBy` (`packages/activerecord/src/relation.ts`) still goes to
ActiveSupport's `groupBy` in `packages/activesupport/src/enumerable-utils.ts`,
which answers a JS `Map` where Ruby answers a Hash.

## Acceptance criteria

- [ ] `Enumerable` in `enumerable.ts` carries `groupBy` as `enum_group_by`
      (`enum.c:1157`, `group_by_i` `:1115`), over `each` like its siblings.
- [ ] The `groupBy` entry is deleted from `ARRAY_METHOD_TABLE`; an Array still
      answers `respond_to?` and `send` for it through the module.
- [ ] `DelegationRecordsTest` in
      `packages/activerecord/src/relation/delegation.test.ts` stays green.
