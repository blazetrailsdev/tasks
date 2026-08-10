---
title: "sec_fraction takes a JS Date at millisecond resolution instead of the Temporal analogue"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DateTime#sec_fraction` returns an exact `Rational` and is what
`ActiveSupport::MessagePack::Extensions.write_datetime` feeds to `write_rational`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:138-145`).

The trails port of `sec_fraction`
(`packages/activesupport/src/time-ext.ts:496`) takes a JS `Date` and returns
`date.getMilliseconds() / 1000` — millisecond resolution, and unusable from a
`Temporal` value at all. Because of that, PR #5634's `writeDatetime` reads the
sub-second fraction straight off the `Temporal.PlainDateTime`'s
millisecond/microsecond/nanosecond fields, and the omitted call had to be
baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activesupport/message-pack/extensions.json`.

`no-native-date` also bans the JS `Date` parameter this helper is built around,
so the ported signature is doubly out of step with the rest of the package.

## Acceptance criteria

- `secFraction` accepts the trails `Time` analogue (`Temporal`), not a JS `Date`,
  and preserves sub-second precision beyond milliseconds.
- `Extensions.writeDatetime` calls it, and the `write_datetime`/`sec_fraction`
  entry is deleted from the wide-call exclude baseline (the ratchet only shrinks).
- `pnpm parity:api --package activesupport` non-negative.
