---
title: "ruby-compat: Marshal cannot round-trip Rational, Date or a Temporal.PlainDate (compat table, allocator, Date seat)"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced un-skipping `attributes with proc defaults can be marshalled`
(`vendor/rails/v8.0.2/activemodel/test/cases/attributes_test.rb:136-143`) after trails#8520 landed
`TYPE_USRMARSHAL`. `Marshal.dump(data)` sends `respond_to?(:marshal_dump, true)` to the model, whose
`AttributeMethods#respond_to?` (`activemodel/lib/active_model/attribute_methods.rb:520-535`) reaches
`attributes` and casts every value, in Rails and in trails alike. So the `date_field` default's
`UserProvidedDefault#marshal_dump` (`attribute/user_provided_default.rb:29-38`) carries five
elements: the `Date` the proc answered and the cast `Date`. ruby-compat's `Marshal`
(`packages/ruby-compat/src/marshal.ts`) cannot round-trip either. Three gaps, measured:

- **`Rational` has no Marshal arm.** `Marshal.dump(new Rational(1, 2))` raises
  `ArgumentError: undefined class/module Rational`: the class is not seated at `Rational`, and it has
  no `marshal_dump`. MRI defines a private `marshal_dump` answering `[num, den]`
  (`vendor/ruby/v3.3.11/rational.c:1857-1865,2804`) and loads through
  `rb_marshal_define_compat(rb_cRational, compat, nurat_dumper, nurat_loader)` (`rational.c:2806-2808`):
  `obj_alloc_by_klass` (`vendor/ruby/v3.3.11/marshal.c:1812-1832`) allocates the compat class, its
  `marshal_load` (`rational.c:1869-1890`) runs, and `r_fixup_compat` (`marshal.c:1667-1681`), under
  `r_leave`, calls the loader. `marshal.ts` has no `compat_allocator_tbl` and its `rObjectFor` JSDoc
  says `r_leave` has "nothing to do". `ruby -e 'p Marshal.dump(Rational(1,2))'` is
  `"\x04\bU:\rRational[\ai\x06i\a"`.
- **`Date` dumps a Rational where MRI dumps an Integer, and cannot be loaded.**
  `Date#marshalDump` (`packages/date/src/date.ts:5720-5722`) answers `mSf()`, a `Rational`
  (`date.ts:5403-5405`); MRI's `d_lite_marshal_dump` answers `m_sf`, an Integer for a whole
  nanosecond count: `Marshal.dump(Date.new(2016,1,1))` is
  `"\x04\bU:\tDate[\vi\x00i\x03-\x7F%i\x00i\x00i\x00f\f2299161"`. On load, `objAllocByKlass`
  (`marshal.ts:889-891`) is `Object.create(klass.prototype)`, and `Date#marshalLoad` then raises
  `TypeError: Cannot write private member #jd to an object whose class did not declare it`.
  `rb_obj_alloc` runs the class's allocator (`rb_get_alloc_func`); a class with `#private` fields
  needs one Marshal can call.
- **A `Temporal.PlainDate` is the seat of `Date` but has no dump arm.** `rbObjClass` answers `rbCDate`
  for it (`packages/ruby-compat/src/object.ts:50`) and `Type::Date#cast_value` answers one
  (`packages/activemodel/src/type/date.ts:42-51`), so every cast date attribute is one.
  `Marshal.dump(Temporal.PlainDate.from("2016-01-01"))` raises
  `TypeError: no _dump_data is defined for class Date`. Decide what `Marshal.load` answers for a
  dumped `Date` so a cast value compares equal after the round trip.

Also seen in the same dump, not blocking it: `Attribute`'s `@value_before_type_cast` and `@value`
are written as `@_value_before_type_cast` / `@_value` with an extra `@_has_value`
(`packages/activemodel/src/attribute.ts:31-36`; no `rbDeclareIvar`), and an attribute Marshal
allocates and loads through `UserProvidedDefault#marshalLoad` with four values has no `_hasValue`
own field where a constructed one holds `false`. `LazyAttributeHash.marshalLoad`
(`packages/activemodel/src/attribute-set/builder.ts:253`) is still a `static`.

## Acceptance criteria

- [ ] `Marshal.dump(new Rational(1, 2))` is byte-equal to MRI's and loads back through the compat
      table (`marshal.c:1812-1832,1667-1681`), ported at MRI's names.
- [ ] `Marshal.dump(new Date(2016, 1, 1))` is byte-equal to MRI's and `Marshal.load` of it answers an
      equal `Date`.
- [ ] A `Temporal.PlainDate` dumps as MRI dumps the `Date` it seats, and loads back equal.
- [ ] `attributes-marshal-round-trip-needs-usrmarshal-arm` is unblocked: the parked test in
      `packages/activemodel/src/attributes.test.ts` passes un-skipped with Rails' body.

## Verification

```bash
pnpm vitest run packages/ruby-compat/src/marshal.test.ts packages/activemodel/src/attributes.test.ts
```
