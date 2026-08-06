---
title: "date-temporal-default-return-and-ruby-opt-in"
status: ready
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split (b) of RFC 0088's `date-state-onto-temporal-plaindate`, whose acceptance
criteria said "**Likely exceeds 500 LOC — split at claim time** into (a)
calendar-math removal and (b) class re-seating". Split (a) shipped as PR
`<PR>`: `packages/date/src/date.ts`'s `Date` is now seated on a private
`Temporal.PlainDate` (`#jd`/`#sg`/`#flags` gone), the `sg`-threaded calendar
math is deleted, ordinal/commercial/weeknum are re-derived from `PlainDate`,
`rtValidDateFragsP`/`dNewByFrags`/`dtNewByFrags` answer a `PlainDate`, and the
calendar-reform surface (`Date::ITALY`/`ENGLAND`/`JULIAN`/`GREGORIAN`,
`#start`, `#julian?`, `#new_start`, `#italy`/`#england`/`#julian`/`#gregorian`)
is gone.

What is left is the RFC's **headline behavioral commitment**, which (a)
deliberately did not touch because it is cross-package:

1. **Default returns become Temporal.** Where a method answers a temporal value
   it must answer `Temporal.PlainDate` / `PlainDateTime` / `ZonedDateTime` /
   `Instant` per the RFC's mapping table. Today `Date.parse`, `Date.civil`,
   `Date.jd`, `Date.ordinal`, `Date.commercial` and `DateTime.parse` all answer
   the Ruby-shaped object.
2. **The Ruby-shaped `Date`/`DateTime` classes stay reachable** via a documented
   opt-in — they are the gem's own API surface and what the ported tests
   construct. Demoted, not deleted.

The RFC deliberately does not fix the opt-in mechanism (an options argument, a
parallel entry point, or a conversion method are all viable). **Choosing it is
part of this story.** Record the reasoning at the call site, not in the PR body.

Consumers that hold the Ruby-shaped object today and would move to the opt-in:

- `packages/i18n/src/backend/localization.test.ts` — `new RubyDate(...)` /
  `new RubyDateTime(...)` passed to `localize`, which duck-types on
  `strftime`/`wday`/`mon`/`hour`/`sec` (`packages/i18n/src/backend/base.ts:248-256`).
- `packages/activesupport/src/i18n.test.ts:18` — `RubyDate.parse("2008-7-2")`.
- `packages/activemodel/src/type/{date,date-time,time}.ts` call `RubyDate._parse`
  only, which answers a fragment object and is **unaffected**.

## Acceptance criteria

- [ ] **Default return type is `Temporal`** for every method answering a temporal
      value — `PlainDate` / `PlainDateTime` / `ZonedDateTime` / `Instant`.
- [ ] The Ruby-shaped `Date`/`DateTime` classes still exist and are still
      reachable via a documented opt-in; the mechanism is chosen and justified
      at the call site.
- [ ] `_parse` still answers a fragment object, `strftime` a `string`, and
      offsets a `number` — the three places Temporal has no analogue.
- [ ] The parse/format region of `date.ts` (everything above `UNIX_EPOCH_IN_CJD`)
      is unchanged.
- [ ] Sub-minute offset handling in `packages/date/src/time.ts:26-28` unchanged
      and still tested.
- [ ] `pnpm api:compare` / `pnpm test:compare` deltas non-negative;
      `pnpm api:calls` clean; any new mismatch converged, not baselined.
- [ ] `pnpm api:extra --package date` — no new untagged extra surface.
