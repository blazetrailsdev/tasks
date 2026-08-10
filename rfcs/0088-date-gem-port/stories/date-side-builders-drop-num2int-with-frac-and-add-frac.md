---
title: "date-side-builders-drop-num2int-with-frac-and-add-frac"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6317
claim: "2026-08-10T12:26:37Z"
assignee: "date-side-builders-drop-num2int-with-frac-and-add-frac"
blocked-by: null
closed-reason: null
---

## Context

Every `Date`-side builder in `date_core.c` reads its last positional through
`num2int_with_frac` / `num2num_with_frac` (`date_core.c:3286-3305`) and ends
with `add_frac()` (`:3314-3318`), which is `d_lite_plus(ret, fr2)` — so
`Date.jd(2451944.5)`, `Date.ordinal(2001, 34.5)`, `Date.civil(2001, 2, 3.5)`
and `Date.commercial(2001, 5, 6.5)` all answer a date carrying a day
fraction.

The ports in `packages/date/src/date.ts` drop both halves:

- `Date.jd` (`date_s_jd`, `date_core.c:3377-3387`) — `checkNumeric` then
  `decodeJd`, no `num2num_with_frac`, no `add_frac`.
- `Date.ordinal` (`date_s_ordinal`, `:3454-3505`).
- `Date.civil` (`date_s_civil`, `:3478`) — delegates to the constructor, which
  takes no fraction.
- `Date.commercial` (`date_s_commercial`, `:3606-3652`) — `checkNumeric(cwday)`
  and `cValidCommercialP`, with the `num2int_with_frac(d, positive_inf)` at
  `:3625` dropped.

`Date.weeknum` and `Date.nthKday` (added by PR #6331) do carry it, so the file
is now inconsistent as well as divergent.

The fraction is not observable through the `Temporal.PlainDate` seat — a
fraction of a day never moves midnight off its own date — but it is observable
on the gem-shaped object the exported `dNewByFrags` route answers, and the
omission is a dropped Rails call either way.

## Acceptance criteria

- [ ] `Date.jd`, `Date.ordinal`, `Date.civil` and `Date.commercial` each run
      their last positional through `num2int_with_frac` / `num2num_with_frac`
      with the C's own `positive_inf` bound and end at `add_frac`, matching
      `Date.weeknum` / `Date.nthKday`.
- [ ] Covered by a test in `packages/date/src/date.trails.test.ts` on the
      gem-shaped receiver, since the `Temporal` seat cannot show the fraction
      and no test in `vendor/date/test/date/` exercises the fractional arm of
      these four.
