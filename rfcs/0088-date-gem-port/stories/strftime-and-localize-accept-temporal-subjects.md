---
title: "strftime and I18n localize must accept Temporal subjects before default returns flip"
status: done
updated: 2026-08-08
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
  - i18n
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6251
claim: "2026-08-08T17:51:58Z"
assignee: "dt-new-by-frags-offset-truncates-to-int"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while claiming `date-temporal-default-return-and-ruby-opt-in` (RFC
0088's headline commitment), which was released back unbuilt because this piece
has to land first and is separately sized.

That story makes `Date.parse` / `civil` / `jd` / `ordinal` / `commercial` and
`DateTime.parse` answer `Temporal` values. The moment they do, two duck types
that receive the gem-shaped object today stop being satisfied — a
`Temporal.PlainDate` has none of these members:

- `Localizable` (`packages/i18n/src/backend/base.ts:248-256`) — what
  `I18n::Backend::Base#localize` asks of its object: `strftime`, `wday`, `mon`,
  `hour`, `sec`. Mirrors `vendor/i18n/lib/i18n/backend/base.rb:83-107`, where
  Ruby's `localize` calls `object.strftime(format)` after `object.respond_to?`
  checks — and Ruby's `::Date`/`::Time` answer those natively, which is what
  makes the duck type work there and not here.
- `StrftimeSubject` (`packages/date/src/date.ts:82-95`) — `year`, `mon`, `day`,
  `wday`, `yday`, `hour`, `min`, `sec`, `nsec`, `zone`, `utcOffset`, read by
  `strftime` (`date_strftime.c`) and by `epochSeconds` for `%s`.

Consumers holding the gem object today, all of which move with the headline
story: `packages/i18n/src/backend/localization.test.ts`,
`packages/i18n/src/backend/fallbacks.test.ts`,
`packages/activesupport/src/i18n.test.ts:18`.
`packages/activemodel/src/type/{date,date-time,time}.ts` call `Date._parse`
only, which answers a fragment object and is unaffected.

## Converged shape

Give `strftime` a way to read a `Temporal` value as a `StrftimeSubject`, so the
one function that formats dates keeps working for both shapes, and make
`localize`'s duck-type check recognise Temporal values.

Ruby needs no such adapter because `::Date`/`::Time` ARE the objects with those
readers — so whatever lands here is trails-only surface and must carry a
`@noRailsEquivalent` tag with a PERMANENT/CONVERGEABLE claim, or (preferred) be
folded into `strftime` itself rather than added as a new exported helper.
Prefer widening `StrftimeSubject`'s accepted input over introducing a wrapper
class: `pnpm parity:api:extra --package date` measures anything new.

Note `strftime` must keep answering a `string`, `_parse` a fragment object, and
offsets a `number` — RFC 0088's three carve-outs where Temporal has no
analogue.

## Acceptance criteria

- [ ] `strftime` accepts a `Temporal.PlainDate` / `PlainDateTime` /
      `ZonedDateTime` / `Instant` and formats it identically to the gem-shaped
      object for every directive the existing pins cover.
- [ ] `I18n::Backend::Base#localize` accepts a Temporal value.
- [ ] `%s` (`epochSeconds`) and `%Z` / `%z` are correct for a zoned value and
      for a date-only value (midnight, UTC — the gem's own `::Date` behavior).
- [ ] No new exported surface in `@blazetrails/date` without a
      `@noRailsEquivalent` claim; `pnpm parity:api:extra --package date` clean.
- [ ] Unblocks `date-temporal-default-return-and-ruby-opt-in`, which stays the
      story that flips the default returns.
