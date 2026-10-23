---
title: "rb-equal-plain-module-identity-for-never-included-modules"
status: claimed
updated: 2026-10-23
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 18
pr: null
claim: "2026-10-23T18:47:27Z"
assignee: "actionview-test-fixtures-under-test-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`rbEqual`'s Hash arm (`packages/ruby-compat/src/rb-equal.ts`, `isHash`) compares any prototype-less or `Object.prototype` object by its entries (`rb_hash_equal`, `vendor/ruby/v3.3.11/hash.c:3808`). A plain-object module is a Ruby Module, whose `==` is identity (`rb_obj_equal`, `vendor/ruby/v3.3.11/object.c:4374`). trails#9133 excludes only a plain object that carries the `@blazetrails/ruby-compat:moduleIncludes` own key, i.e. one that has `include`d something. Two plain-object modules that never included anything (e.g. two helper modules with the same methods) still compare equal by contents, and `Object.entries` runs their getters.

## Acceptance criteria

- A plain-object module is recognisable at definition (a marker set by every module-defining path, or an owner-decided rule), and `rbEqual` / `rbEql` answer identity for it.
- A ruby-compat test shows two distinct never-included plain-object modules with equal members are not `rbEqual`.
