---
title: "Register the remaining ActiveSupport::MessagePack native extension types"
status: claimed
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["activesupport-messagepack-port"]
deps-rfc: []
est-loc: 350
priority: 5
pr: null
claim: "2026-06-14T19:24:12Z"
assignee: "activesupport-messagepack-native-extension-types"
blocked-by: null
---

## Context

`activesupport-messagepack-port` (PR #3255, merged) ported the
`ActiveSupport::MessagePack` infrastructure into
`packages/activesupport/src/message-pack/`: the `Factory` binary codec (base
scalars + ext format, recursive + non-recursive), the `Serializer` /
`CacheSerializer` modules, the `Extensions` registration surface, the type-127
unregistered-type-error / object-fallback handlers, and the `Symbol` (type 0)
extension type — all pinned byte-identical to MRI Rails 8.0.2. The encryption
serializer now delegates to it.

To keep that PR within the LOC ceiling and avoid shipping lossy/stub
representations, the remaining Ruby-native extension types were deferred. They
each need a faithful JS representation (some of which do not yet exist or are
lossy in JS) and an MRI fixture.

Concrete gap surfaced in review: `Factory#writeNumber` currently THROWS on
integers outside the 32-bit native range (`> 0xffffffff` / `< -0x80000000`)
rather than corrupting them, because MRI routes oversized integers through the
Integer ext type (1) before reaching a native int. This story must restore
full integer support: 64-bit native ints AND the `MessagePack::Bigint` ext.

## Scope

Register the remaining `Extensions` type IDs against their trails/JS
representations, byte-identical to MRI (see
`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb`):

- 1 Integer (oversized / `MessagePack::Bigint`) + widen native int encoding to
  64-bit (lift the `writeNumber` throw added in #3255),
- 2 BigDecimal, 3 Rational, 4 Complex, 5 DateTime, 6 Date, 7 Time,
  8 ActiveSupport::TimeWithZone, 9 ActiveSupport::TimeZone,
  10 ActiveSupport::Duration, 11 Range, 12 Set, 13 URI::Generic, 14 IPAddr,
  15 Pathname, 16 Regexp, 17 ActiveSupport::HashWithIndifferentAccess.
- Port the `MessagePackSharedSerializerTests` roundtrip cases for each type
  registered (names verbatim).

## Acceptance criteria

- [ ] Each registered type round-trips byte-identically with MRI (fixtures).
- [ ] Integers across the full 64-bit range and bigints round-trip (the #3255
      `writeNumber` throw is replaced by faithful encoding).
- [ ] `enshrines type IDs` parity: registered type→class map matches Rails.
- [ ] Shared serializer roundtrip tests pass for the implemented types.

## Notes

Types whose JS representation is genuinely lossy or absent (e.g. Rational/
Complex/DateTime nanosecond precision) should be called out explicitly rather
than shipped lossy; descope individually with a written reason if needed.
