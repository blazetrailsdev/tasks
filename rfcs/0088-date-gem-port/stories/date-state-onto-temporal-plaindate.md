---
title: "date-state-onto-temporal-plaindate"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["date-api-compare-enrollment", "date-test-compare-enrollment"]
deps-rfc: []
est-loc: 450
pr: 6153
claim: "2026-08-06T14:03:03Z"
assignee: "date-state-onto-temporal-plaindate"
blocked-by: null
closed-reason: null
---

## Context

**Runs last, deliberately** — after `parity:api` and `parity:test` enrollment,
so the substrate migration is _measured_ rather than taken on faith. This is the
only story in the RFC that changes behavior.

**Makes `Temporal` the default return type.** Per the RFC's contract this story
has two halves that must not be collapsed:

1. **Default returns become Temporal.** Where a method answers a temporal value,
   it answers `Temporal.PlainDate` / `PlainDateTime` / `ZonedDateTime` /
   `Instant`. This is the RFC's headline behavioral commitment.
2. **The Ruby-shaped `Date` class stays available as an option.** It is the gem's
   own API surface, it is what the ported tests construct and exercise, and the
   parse/format machinery lives on it. It is simply no longer what the default
   entry points hand back. **Do not delete the class** — demote it.

The RFC deliberately does not fix the opt-in mechanism (an options argument, a
parallel entry point, or a conversion method are all viable). **Choosing it is
part of this story**, now that the ported surface is visible. Whatever is chosen,
record the reasoning at the call site, not in the PR body.

What is genuinely deleted is the Ruby-_internal_ representation, which is not the
same thing as the Ruby-shaped object. `packages/date/src/date.ts` currently
carries `#jd` and `#sg`
(`date.ts:2228-2233`) — the Julian day and the calendar-reform start — plus the
`sg`-threaded calendar math at `date.ts:1715-2205` (`cCivilToJd`, `cJdToCivil`,
`cFindFdoy`, `cValidCivilP`, ordinal/commercial/weeknum) and the `Date`/`DateTime`
classes at `date.ts:2206-2554`. That is **840 lines**.

Per the RFC's gap table these are **not observable** through any surface trails
exposes: reaching the Julian arm needs a pre-1582 date _and_ a non-default
`start`, and no AR column, `localize` call, or format helper passes `start`.
Likewise `Rational` offsets (`date.ts:431-471`) — no real zone, DB column, or
`strftime` directive exposes sub-nanosecond offset precision.

**The 1,714-line parse/format region (`date.ts:1-1714`) is representation-agnostic
and does not move.** It is 67% of the file and is boundary fidelity that survives
the substrate change untouched — do not touch it here.

Two seams are mixed and must be re-cut rather than deleted: `rtValidDateFragsP`
(`date.ts:2101`) and `dNewByFrags` (`date.ts:2162`), where parsing reaches into
calendar validity.

Sub-minute UTC offsets are **already** handled correctly and must stay that way:
`time.ts:26-28` keeps the offset as a plain number _"so that MRI's sub-minute
offsets are representable where a Temporal offset time zone (minute-precision)
cannot hold them."_

## Acceptance criteria

- [ ] **Default return type is `Temporal`** for every method answering a temporal
      value — `PlainDate` / `PlainDateTime` / `ZonedDateTime` / `Instant` per the
      RFC's mapping table.
- [ ] **The Ruby-shaped `Date`/`DateTime` classes still exist and are still
      reachable** via a documented opt-in. Demoted, not deleted.
- [ ] The opt-in mechanism chosen and justified at the call site.
- [ ] `_parse` still answers a fragment object, `strftime` a `string`, and
      offsets a `number` — the three places Temporal has no analogue.
- [ ] `#jd`/`#sg` removed; the class carries a `Temporal.PlainDate`.
- [ ] The `sg`-threaded calendar math at `date.ts:1715-2205` deleted, with
      ordinal/commercial/weeknum re-derived from `PlainDate`.
- [ ] `Date::ITALY`/`ENGLAND`/`JULIAN`/`GREGORIAN` kept as inert constants only if
      a test names them; otherwise removed.
- [ ] `rtValidDateFragsP` and `dNewByFrags` re-cut onto `PlainDate` validity.
- [ ] `date.ts:1-1714` (parse + `strftime`) **unchanged**.
- [ ] Sub-minute offset handling in `time.ts` unchanged and still tested.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative — this is the
      first story where those gates actually constrain the work.
- [ ] `pnpm parity:api:calls` clean; any new mismatch converged, not baselined.
- [ ] **Likely exceeds 500 LOC — split at claim time** into (a) calendar-math
      removal and (b) class re-seating. Do not ship one oversized PR.
