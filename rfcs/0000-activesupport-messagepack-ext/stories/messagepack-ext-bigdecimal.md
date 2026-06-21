---
title: "MessagePack ext type 2 BigDecimal (_dump/_load Marshal-style codec)"
status: draft
updated: 2026-06-15
rfc: "0000-activesupport-messagepack-ext"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `ActiveSupport::MessagePack::Extensions`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:31`)
registers ext **type 2** for `BigDecimal`:

```ruby
registry.register_type 2, BigDecimal,
  packer: :_dump,
  unpacker: :_load
```

i.e. it serializes via `BigDecimal#_dump` (the Marshal-style precision-bearing
string, e.g. `"18:0.1e1"`) and reconstructs via `BigDecimal._load`.

trails' extension registry
(`packages/activesupport/src/message-pack/extensions.ts:89-152`) registers
types `0` (Symbol), `1` (Integer), `9` (TimeZone), `12` (Set), `17`
(HashWithIndifferentAccess), and `127` (Object) — but **not type 2**. A
`BigDecimal` therefore round-trips through the generic `Object` (127) path or
fails, instead of the dedicated, byte-compatible type-2 codec Rails emits — so
trails-encoded MessagePack is not interchange-compatible with Rails for decimal
values.

trails already has a `BigDecimal` value class
(`packages/activesupport/src/core-ext/big-decimal/conversions.ts`) with the
`to_s("F")`/conversion support the quoting layer uses, so this is wiring a new
ext registration around the existing class, not porting BigDecimal itself. The
`_dump`/`_load` wire format (the `<precision>:<significant-digits>` string) must
match Ruby's exactly for cross-runtime compatibility.

## Acceptance criteria

- [ ] Register ext **type 2** for `BigDecimal` in
      `message-pack/extensions.ts`, mirroring `extensions.rb:31` (packer
      `_dump`-equivalent, unpacker `_load`-equivalent).
- [ ] The wire bytes match Ruby's `BigDecimal#_dump` format exactly (port/verify
      the `<precision>:<mantissa>` encoding) so a value encoded by trails
      decodes in Ruby and vice-versa.
- [ ] Round-trip tests in `message-pack/serializer.test.ts` (or the AR
      `message-pack.test.ts`) cover representative magnitudes/precisions
      (integers-as-decimal, fractional, negative, very large precision); mirror
      any corresponding Rails test names verbatim.
- [ ] api:compare / test:compare delta non-negative.
