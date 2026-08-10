---
rfc: "0041-activesupport-messagepack-ext"
title: "ActiveSupport MessagePack ext-type registry (Ruby interchange fidelity)"
status: draft
created: 2026-06-21
updated: 2026-07-27
owner: "@deanmarano"
packages:
  - "activesupport"
clusters: []
related-rfcs:
  - "0023-surfaced-deviations"
priority: 2
---

## Summary

Port the remaining `ActiveSupport::MessagePack::Extensions` ext-type registry so
trails' MessagePack encoding is byte-interchange-compatible with Ruby. This is a
**missing feature**, not a Rails deviation — it was filed piecemeal under the
0023 deviations bucket but is a coherent, ordered body of work on one subsystem
(`packages/activesupport/src/message-pack/extensions.ts`), so it gets its own RFC.

## Motivation

Rails registers a fixed set of ext types in
`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb`. trails'
registry covers `0` (Symbol), `1` (Integer), `5`/`6`/`7`/`8`
(DateTime/Date/Time/TimeWithZone — landed since this RFC was written), `9`
(TimeZone), `12` (Set), `17` (HashWithIndifferentAccess), `127` (Object). Still
missing: `2` (BigDecimal), `3`/`4` (Rational/Complex), `10` (Duration), and
`11`/`13`-`16` (Range/URI/IPAddr/Pathname/Regexp). The rest fall through the
generic `Object` (127) path or fail, so trails-encoded MessagePack does not
round-trip with Ruby for decimals, rationals/complex, temporal types, and the
value classes. The building blocks already exist in trails (`BigDecimal` value
class, `Temporal`-based date/time, `Duration`), so each story is wiring an ext
registration with a Ruby-exact wire format around an existing class — not porting
the class itself. Cross-runtime byte fidelity is the crux throughout.

## Rollout

No hard ordering; ship smallest-first. The temporal story self-sequences (land
5/6/10 first, follow-up 7/8 if the nanosecond `Time` rep exceeds one PR). Each
story is independently mergeable; `api/parity:test` delta stays non-negative.

- `messagepack-ext-bigdecimal` — ext type 2 (`_dump`/`_load` precision string).
- `messagepack-ext-rational-complex` — Rational/Complex ext types.
- `messagepack-ext-temporal` — only type 10 (Duration) remains; 5/6/7/8
  have landed.
- `messagepack-ext-value-classes` — remaining value-class ext registrations.

(Authored under 0023; moved here verbatim — bodies carry `extensions.rb` line
refs, trails `file:line`, and acceptance criteria.)
