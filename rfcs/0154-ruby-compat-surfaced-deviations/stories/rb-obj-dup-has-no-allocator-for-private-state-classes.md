---
title: "rbObjDup has no class allocator, so a class with #private state or a Proxy dups into a broken copy"
status: closed
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "date", "activesupport"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: trails#8411 added the rb_define_alloc_func seat itself; the remaining classes are filed as classes-with-private-state-declare-an-rb-obj-dup-allocator"
---

## Context

Surfaced while shipping `deep-dup-has-no-object-arm-so-classes-hand-write-it`, which made
`deepDup` (`packages/activesupport/src/hash-utils.ts`) fall through to Ruby's `Object#deep_dup`
arm, `duplicable? ? dup : self`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/deep_dup.rb:15-17`).

`rbObjDup` / `rbObjClone` (`packages/ruby-compat/src/include.ts`) allocate the copy in
`rbObjAlloc` with `Object.create(proto)` and then copy the own property descriptors. MRI allocates
through the class's allocator (`rb_obj_alloc`, `vendor/ruby/v3.3.11/object.c:2117`, called from
`rb_obj_dup`, `:591-600`) and fills it in `initialize_copy`. `Object.create` cannot install
`#private` fields and cannot re-wrap a `Proxy`, so the copy of any class holding either is a
broken object: its methods raise `TypeError` on the first private read.

That PR handled the receivers it could reach: `rbObjAlloc` now allocates a JS `Date`, `Map`, `Set`
and `RegExp` from the receiver, a Temporal value is returned as is, and `Time`
(`packages/date/src/time.ts`) and `TimeWithZone` (`packages/activesupport/src/time-with-zone.ts`)
gained a `dup()` that `deepDup` sends, as `Date#dup` (`packages/date/src/date.ts`) already did.

What is left is every other class with `#private` state and no `dup()` of its own. `rbObjDup` on
one still returns a broken copy, and `deepDup` now reaches `rbObjDup` for them. Known holders:
ruby-compat's `Hash` (when dup'd through `rbObjDup` rather than `dup(hash)`), `MatchData`,
`StringScanner`, `Gem::Version`, `Method`; date's `DateInfinity`; activerecord's `Result`,
`FutureResult`, `DatabaseConfig`.

## Converged shape

One allocator seat in ruby-compat, mirroring `rb_define_alloc_func` / `Class#allocate`
(`rb_class_alloc_m`, `vendor/ruby/v3.3.11/object.c:2066`): `rbObjAlloc` asks the receiver's class
for its allocation, and the class copies its private state in `initializeCopy`, at the Ruby name.
`Time#dup`, `Date#dup` and `TimeWithZone#dup` then collapse onto `rbObjDup`.

## Acceptance criteria

- [ ] `rbObjDup` / `rbObjClone` of a class with `#private` state yields a working copy, through an
      allocator the class declares; no class open-codes a `dup()` to work around `rbObjAlloc`.
- [ ] `Time`, `Date`, `DateTime` and `TimeWithZone` port `initialize_copy` at its Ruby name and
      drop their hand-written `dup()`.
- [ ] A test dups each listed class through `rbObjDup` and calls a method that reads private state.
