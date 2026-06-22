---
title: "MessagePack ext types 3 Rational + 4 Complex (need JS numeric value classes)"
status: ready
updated: 2026-06-15
rfc: "0041-activesupport-messagepack-ext"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails registers ext **types 3 and 4** for `Rational` and `Complex`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:35-43`),
each packing its two integer/numeric components and reconstructing via the
Ruby constructor:

```ruby
registry.register_type 3, Rational,
  packer: ->(rational) { ... numerator / denominator ... },
  unpacker: ->(unpacker) { Rational(unpacker.read, unpacker.read.zero? ? 1 : ...) }
registry.register_type 4, Complex,
  packer: ->(complex) { [complex.real, complex.imaginary] },
  unpacker: ->(unpacker) { Complex(unpacker.read, unpacker.read) }
```

(See the read helpers at `extensions.rb:127` and `:136`.)

trails' registry (`packages/activesupport/src/message-pack/extensions.ts:89-152`)
registers neither type 3 nor type 4. Unlike `BigDecimal` (type 2, which has an
existing value class), **JavaScript has no native `Rational` or `Complex`**, and
`grep` confirms no value class exists in trails
(`packages/activesupport/src` / `packages/activerecord/src`). So this story has
two parts:

1. Port minimal `Rational` and `Complex` value classes (numerator/denominator;
   real/imaginary) with Ruby-faithful normalization (`Rational` reduces to
   lowest terms with a positive denominator) and `to_s`.
2. Register ext types 3 and 4 around them, matching the Rails component wire
   order/format.

These are paired because the codec is meaningless without the value class. Keep
the value classes minimal (construction + the fields the codec needs + `to_s`);
do not build out full arithmetic unless a consumer needs it (register a
follow-up story if so).

## Acceptance criteria

- [ ] Minimal `Rational` and `Complex` value classes exist in `activesupport`
      with Ruby-faithful construction/normalization and `to_s`.
- [ ] Ext **types 3 (Rational)** and **4 (Complex)** are registered in
      `message-pack/extensions.ts`, mirroring `extensions.rb:35-43` component
      packing and the `:127`/`:136` unpack order.
- [ ] Round-trip tests cover reduced/unreduced rationals, negative denominators,
      zero-imaginary complex, etc.; cross-runtime byte-compatible with Ruby.
- [ ] Scoped to ≤500 LOC; if the value classes balloon, split them into their
      own story and keep this one to the codec.
- [ ] api:compare / test:compare delta non-negative.
