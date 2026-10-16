---
title: "msgpack parity: ext types 2, 3 and 4, BigDecimal, Rational and Complex"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
cluster: ext
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of Phase 3, the ext-registry sweep over the 19 type ids
`packages/activesupport/src/message-pack/extensions.ts:96-196` registers. Each
ext story extends the value-spec union with its classes, adds a Ruby builder
arm in `oracle.rb`, generates against the gem with
`ActiveSupport::MessagePack`'s factory installed, and commits corpus cases.

Type 2 packs `BigDecimal` through `_dump` / `_load`, which is a string format
with a significant-digits prefix — precision and the prefix are both
divergence candidates. Types 3 and 4 are `recursive: true`, so `Rational` and
`Complex` pack their components back through the packer and inherit every
integer and float question from Phase 2.

RFC 0184 has a related story, `big-decimal-max-prec-outside-literal-parse`,
which is a sign this area has sharp edges already.

## Acceptance criteria

- [ ] BigDecimal: zero, negative zero, high precision, very large and very
      small exponents, NaN and the infinities if representable, and values whose
      `_dump` prefix differs from their digit count.
- [ ] Rational: zero numerator, negative denominator, unreduced input,
      components past 2^53, and a 1-denominator value.
- [ ] Complex: zero imaginary, negative zero components, integer versus float
      components (asserting the two differ), and components past 2^53.
- [ ] The recursive arms are asserted to pack components through the same
      integer and float rules Phase 2 pins.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
