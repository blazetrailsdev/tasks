---
title: "Classes with #private state declare an rbObjDup allocator; Date and DateTime drop their hand-written dup"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "date", "activerecord"]
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

Follows trails PR 8411, which gave `rbObjDup` / `rbObjClone`
(`packages/ruby-compat/src/include.ts`) the class allocator MRI's `rb_obj_dup` calls
(`rb_obj_alloc`, `vendor/ruby/v3.3.11/object.c:2117`, from `rb_obj_dup`, `:591-600`).
`rbDefineAllocFunc(klass, func)` is `rb_define_alloc_func`
(`vendor/ruby/v3.3.11/vm_method.c:1270`), and `rbObjAlloc` finds it up the superclass chain as
`rb_get_alloc_func` does (`:1286`). A class whose instances hold state `Object.create` cannot make
declares an allocator and copies that state in `initializeCopy`.

That PR declared two: `Time` (`packages/date/src/time.ts`, with `initializeCopy` ported from
`time_init_copy`, `vendor/ruby/v3.3.11/time.c:4046`) and `TimeWithZone`
(`packages/activesupport/src/time-with-zone.ts`, whose constructor returns a Proxy).

Every other class with `#private` state and no allocator still dups into a broken copy: its
methods raise `TypeError` on the first private read. `deepDup`
(`packages/activesupport/src/hash-utils.ts`) reaches `rbObjDup` for any duplicable object since
that PR, as `Object#deep_dup` does
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/deep_dup.rb:15-17`).
Known holders: ruby-compat's `Hash` (when dup'd through `rbObjDup` rather than `dup(hash)`),
`MatchData`, `StringScanner`, `Gem::Version`, `Method`; date's `DateInfinity`; activerecord's
`Result`, `FutureResult`, `DatabaseConfig`.

`Date` and `DateTime` (`packages/date/src/date.ts`) work around the same gap with a hand-written
`dup()` beside their `initializeCopy` (`d_lite_initialize_copy`,
`vendor/ruby/v3.3.11/ext/date/date_core.c:5147`). Ruby has no `Date#dup`; it is `Object#dup` over
the allocator.

## Acceptance criteria

- [ ] `Date` and `DateTime` declare an allocator and drop `dup()`; `rbObjDup(date)` returns a
      working copy.
- [ ] Each listed class either declares an allocator plus `initializeCopy`, or is shown never to
      reach `rbObjDup` / `deepDup`.
- [ ] A test dups each converted class through `rbObjDup` and calls a method that reads private
      state.
