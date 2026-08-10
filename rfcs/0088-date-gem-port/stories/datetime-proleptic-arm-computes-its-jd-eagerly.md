---
title: "DateTime's proleptic arm computes the Julian day eagerly where the C defers to get_c_jd"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6299
claim: "2026-08-09T20:39:15Z"
assignee: "datetime-proleptic-arm-computes-its-jd-eagerly"
blocked-by: null
closed-reason: null
---

## Context

`datetime_initialize`'s proleptic-Gregorian arm
(`vendor/date/ext/date/date_core.c:7850-7869`) calls `set_to_complex` with
`rjd` of `0` and the flags `HAVE_CIVIL | HAVE_TIME` — no Julian day at all. The
day is computed later, on first read, by `get_c_jd` (`:1262-1301`), which is
`c_civil_to_jd` under `c_virtual_sg` taken through `jd_local_to_utc`.

trails computes it eagerly instead. PR #6290 states the reason at the call site
(the `datetime_initialize` JSDoc in `packages/date/src/date.ts`): the C applies
its fraction with the `add_frac()` macro (`:3313-3317`), which hands `self` to
`d_lite_plus` and returns a NEW object, so the half-built receiver's day is
never read; trails applies `addFrac` in place, so there is no point at which the
day is still unread.

`Date`'s half of the same split IS lazy after #6290 — `Date.#getSJd` is
`get_s_jd` (`:1168-1187`) and the proleptic arm stores the civil triple alone —
so this is the one remaining eager half.

No value diverges today: the eagerly-computed day is exactly what `get_c_jd`
would compute. What is missing is the state shape, and with it the C's ability
to hold a `DateTime` whose day was never needed.

## Converged shape

Make `DateTime`'s `#jd`/`#df` optional behind a `getCJd` / `getCDf` pair at the
C's names, and apply the fraction the way `add_frac` does — by building the
result from `d_lite_plus` rather than folding it into the constructor's own
locals. The proleptic arm then stores `HAVE_CIVIL | HAVE_TIME` as the C does.

The eager-computation note in `datetime_initialize`'s JSDoc is deleted by this
story, not reworded.

## Acceptance criteria

- [ ] `DateTime`'s proleptic arm stores no Julian day; `getCJd` fills it on
      first read.
- [ ] `add_frac` is applied as the C applies it, so the constructor does not
      need the day in order to finish.
- [ ] Every value in `date.trails.test.ts` is unchanged, including the 24:00
      rollover (`canon24oc`) and the fractional-second cases.
