---
title: "ruby-compat/date: Marshal.load of a Date raises on its #private fields (no allocator)"
status: draft
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
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

Found while implementing `marshal-cannot-dump-a-date-rational-is-unseated`. `Marshal.dump` of a
`Date` / `DateTime` is now byte-equal to MRI's, but `Marshal.load` of those bytes raises:

```text
TypeError: Cannot write private member #jd to an object whose class did not declare it
  Date.marshalLoad  packages/date/src/date.ts (the `this.#jd = jd` write)
  rObjectFor        packages/ruby-compat/src/marshal.ts (TYPE_USRMARSHAL arm)
```

Two things differ from MRI:

- `obj_alloc_by_klass` (`vendor/ruby/v3.3.11/marshal.c:1812-1832`) allocates with `rb_obj_alloc`,
  which runs the class's allocator. trails' `objAllocByKlass` (`packages/ruby-compat/src/marshal.ts`)
  is a bare `Object.create(klass.prototype)` and never consults the allocator table
  `rbDefineAllocFunc` fills (`packages/ruby-compat/src/include.ts`, `rb_define_alloc_func`,
  `vendor/ruby/v3.3.11/vm_method.c:1270`; the reader `rbGetAllocFunc` is module-private there).
- `Date` registers no allocator. MRI's is `d_lite_s_alloc`
  (`vendor/ruby/v3.3.11/ext/date/date_core.c:3095-3098`), which is `d_lite_s_alloc_complex`
  (`:3083-3092`). `Time` already registers one (`packages/date/src/time.ts`, `rbDefineAllocFunc(Time, …)`).
  A Date's state lives in `#private` fields, which only its constructor can install.

This is the last layer under activemodel's skipped
`attributes with proc defaults can be marshalled` (`packages/activemodel/src/attributes.test.ts`,
Rails `vendor/rails/v8.0.2/activemodel/test/cases/attributes_test.rb:136-143`), whose model holds a
`Date.new(2016, 1, 1)` default. The date gem's own `test_marshal`
(`vendor/ruby/v3.3.11/test/date/test_date_marshal.rb:7-48`) is ported in
`packages/date/src/test-date.test.ts` over a hand-rolled `Marshal` stand-in for the same reason.

## Acceptance criteria

- [ ] `objAllocByKlass` allocates through the class's registered allocator, as `rb_obj_alloc` does.
- [ ] `Date` registers an allocator mirroring `d_lite_s_alloc` (`date_core.c:3095-3098`), which
      `DateTime` inherits.
- [ ] `Marshal.load(Marshal.dump(d))` round-trips a `Date`, a `DateTime` and a subclass of each;
      `rbObjDup` / `rbObjClone` of a Date still pass their tests.
- [ ] `packages/date/src/test-date.test.ts` drops its `Marshal` stand-in for ruby-compat's.
- [ ] activemodel's `attributes with proc defaults can be marshalled` is un-skipped if nothing
      further is under it; otherwise the next layer is filed.
