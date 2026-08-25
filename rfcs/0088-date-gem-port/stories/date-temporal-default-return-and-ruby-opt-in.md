---
title: "date-temporal-default-return-and-ruby-opt-in"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
deps:
  - strftime-and-localize-accept-temporal-subjects
deps-rfc: []
est-loc: null
priority: null
pr: 6264
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
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `pnpm parity:api:calls` clean; any new mismatch converged, not baselined.
- [ ] `pnpm parity:api:extra --package date` — no new untagged extra surface.

## Findings, 2026-08-08 (from the `date-temporal-default-return-and-ruby-opt-in` bundle)

Claimed as part of a five-story bundle and released unbuilt — the other four
shipped as PR #6263. Three things were established that the next agent should
not re-derive.

**The surface to flip is small; the blocker is not size.** Only ten functions
answer a Ruby-shaped temporal value, and no instance arithmetic (`#+`,
`#advance`, `#next_day`) is ported yet, so the RFC mapping table's fourth row is
currently vacuous:

- `dNewByFrags` (`date.ts:3530`), `dtNewByFrags` (`:3602`)
- `Date.jd` (`:3822`), `.ordinal` (`:3832`), `.civil` (`:3845`),
  `.commercial` (`:3856`), `.strptime` (`:3885`), `.parse` (`:3973`)
- `DateTime.parse` (`:4263`), `DateTime.strptime` (`:4286`)

**`DateTime extends Date` makes the flip a hard TS type error — TS2417.** This
is the real blocker and it needs a decision before any code is written.
`DateTime.parse`/`.strptime` are `static override`s of `Date.parse`/`.strptime`.
The moment the base answers `Temporal.PlainDate` and the override answers
`Temporal.PlainDateTime`, TS rejects the subclass outright:

```text
error TS2417: Class static side 'typeof DateTime' incorrectly extends
base class static side 'typeof Date'.
  The types returned by 'parse(...)' are incompatible between these types.
```

Verified on a minimal repro. Ruby has no counterpart problem — `datetime_s_parse`
is a separate C function and the return types never have to relate. TS
static-side variance is invariant on the return type here, so the options are:
widen the base's return (a lie for `Date.parse`), stop `DateTime` extending
`Date` (which Ruby's `DateTime < Date` says it must), or keep the Ruby-shaped
statics as the class surface and put the Temporal defaults on a parallel entry
point. **None is obviously right, and the choice interacts with the opt-in
mechanism the story already says is in scope.** Pick both together.

**`DateTime`'s Temporal target is under-specified in the RFC, not merely
unchosen.** The mapping table says `DateTime` → "`Temporal.PlainDateTime`
(+ offset where carried)", but there is no single Temporal value that carries
both. `DateTime` stores `of` in _seconds_ (`date.ts`'s `#of`, mirroring
`ComplexDateData`), and the RFC's own divergence table pins offsets as `number`
**because** Temporal offset time zones are minute-precision and MRI has
sub-minute offsets (`time.ts:26-28`). So `DateTime.parse("…+07:07:07")` can be
answered by neither `PlainDateTime` (drops the offset) nor `ZonedDateTime`
(rounds it to the minute). Either the return is a pair, or the sub-minute case
is explicitly declared unrepresentable for `DateTime` — an RFC-level call.

**Consumer churn is bounded and already aliased.** Only three files outside the
package hold the Ruby-shaped object, and all three already import it as
`RubyDate`/`RubyDateTime`: `i18n/src/backend/localization.test.ts:14`,
`i18n/src/backend/fallbacks.test.ts:23`, `activesupport/src/i18n.test.ts:5`.
The `activemodel/src/type/*` files call `RubyDate._parse` only and are
unaffected, as the story already records. The bulk of the churn is internal: 121
call sites across `packages/date/src/date.trails.test.ts` (1311 lines) construct
or call the flipped statics.
