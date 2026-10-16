---
title: "msgpack parity: ext types 7, 8 and 9, Time, TimeWithZone and TimeZone"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: ext
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 320
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

Type 7 is `Time`, type 8 `TimeWithZone` and type 9 `TimeZone` through
`dumpTimeZone` / `loadTimeZone`. These three carry the most environment
dependence in the registry: a zone identifier must round-trip, and
`ruby-compat`'s tzdata handling (`packages/date/src/tzdata-isdst.ts`) must
agree with Ruby's TZInfo on the offset.

The msgpack timestamp extension has three on-wire forms — 32, 64 and 96 bit —
and the gem picks by range and precision (`packages/msgpack/src/timestamp.ts`).
Picking a wider form than the gem is byte-visible and round-trip-invisible.

## Acceptance criteria

- [ ] All three timestamp widths exercised by construction: a whole-second
      time in the 32-bit range, a nanosecond time in the 64-bit range, and a
      pre-epoch or far-future time needing 96 bits.
- [ ] Pre-epoch, the 2038 boundary, and far-future times covered.
- [ ] Nanosecond precision preserved, including a nanosecond value whose last
      digits are zero.
- [ ] TimeWithZone across a DST transition in both directions, and in a zone
      with a non-whole-hour offset.
- [ ] TimeZone covered for a representative set of identifiers including one
      Rails abbreviation that differs from its TZInfo identifier.
- [ ] A Time and a TimeWithZone for the same instant assert different bytes.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
