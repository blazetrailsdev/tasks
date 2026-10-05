---
title: "ruby-compat/date: Marshal.dump of a Date raises 'undefined class/module Rational'"
status: ready
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: closeout
packages: ["ruby-compat", "date"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while verifying `activemodel-parity-100-final-verification` at trails 1530abf4e6.
`attributes-marshal-round-trip-needs-usrmarshal-arm` says its test waits on the `marshal_dump` /
`TYPE_USRMARSHAL` arms. Both have landed (trails PR 8520, PR 8525), and the test model is already
seated as `ActiveModel::AttributesTest::ModelForAttributesTest`. Un-skipping
`attributes with proc defaults can be marshalled` (`packages/activemodel/src/attributes.test.ts:201`,
Rails `vendor/rails/v8.0.2/activemodel/test/cases/attributes_test.rb:136-143`) now fails one layer
further down:

```text
ArgumentError: undefined class/module Rational
  rbPathToClass packages/ruby-compat/src/variable.ts:118
  class2path    packages/ruby-compat/src/marshal.ts:108
  wClass        packages/ruby-compat/src/marshal.ts:338
```

The model's `date_field` default is `Date.new(2016, 1, 1)`. A bare
`Marshal.dump(new RubyDate(2016, 1, 1))` raises the same error, so the gap is not activemodel's.
Two things differ from MRI:

- `Date#marshalDump` (`packages/date/src/date.ts:5720-5722`) answers `this.mSf()`, and `mSf`
  (`date.ts:5403-5405`) answers `new Rational(0, 1)` for a date with no sub-second part. MRI's
  `m_sf` (`vendor/ruby/v3.3.11/ext/date/date_core.c:1547-1553`) answers `INT2FIX(0)` for a simple
  date and the Integer nanosecond count `x->c.sf` for a complex one, so `d_lite_marshal_dump`
  (`date_core.c:7547-7567`) writes an Integer at index 3. Measured with `ruby`:
  `Date.new(2016,1,1).marshal_dump` is `[0, 2457389, 0, 0, 0, 2299161.0]`, and
  `DateTime.new(2016,1,1,1,2,Rational(7,2)).marshal_dump` is
  `[0, 2457389, 3723, 500000000, 0, 2299161.0]`.
- ruby-compat's `Rational` (`packages/ruby-compat/src/rational.ts:80`) is not a registered
  constant and has no `marshalDump`. MRI defines the class at `vendor/ruby/v3.3.11/rational.c:2759`
  and dumps it through `nurat_marshal_dump` (`rational.c:1857`, registered private at `:2804`),
  loading through the `compatible` class and `rb_marshal_define_compat` (`rational.c:2806-2808`).
  `Marshal.dump(Rational(1,2))` is `"\x04\bU:\rRational[\ai\x06i\a"`.

Either one unblocks the activemodel test. Converging the first makes the Date dump byte-equal to
MRI's. The second is needed for any value that really holds a Rational.

## Acceptance criteria

- [ ] `Marshal.dump(new Date(2016, 1, 1))` succeeds and its `marshal_dump` array holds an Integer
      at index 3, as `date_core.c:1547-1553` and `:7547-7567` produce.
- [ ] `Marshal.load(Marshal.dump(new Rational(1, 2)))` round-trips, with `Rational` resolvable by
      `rbPathToClass`, mirroring `rational.c:1857-1890` and `:2804-2808`.
- [ ] A test in each package fails on trails 1530abf4e6 and passes after.

## Verification

```bash
pnpm vitest run packages/ruby-compat/src/marshal.test.ts packages/date/src/test-date.test.ts
```
