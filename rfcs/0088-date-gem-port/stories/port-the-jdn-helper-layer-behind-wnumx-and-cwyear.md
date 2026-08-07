---
title: "wnumx inlines c_jd_to_weeknum's algebra instead of porting the JDN helpers"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6203
claim: "2026-08-07T21:36:46Z"
assignee: "port-the-jdn-helper-layer-behind-wnumx-and-cwyear"
blocked-by: null
closed-reason: null
---

## Context

PR #6193 added `%U`/`%W` to `strftime` and, with them, `wnumx`
(`packages/date/src/date.ts`), which stands in for `m_wnumx`
(`vendor/date/ext/date/date_core.c:1895-1917`).

The C reaches its answer through two extracted helpers:

- `c_jd_to_weeknum(jd, f, sg, &ry, &rw, &rd)` (`date_core.c:622-632`), which
  calls
- `c_jd_to_civil` (`date_core.c:594-620`) and `c_find_fdoy`
  (`date_core.c:565-575`) to get the Julian Day Number of January 1.

The port has neither helper. `wnumx` instead carries a closed form — the
algebraic reduction of `c_jd_to_weeknum` once `fdoy` is written as
`jd - (yday - 1)`, at which point both `jd` terms cancel and the week number
falls out of the subject's own `yday` and `wday`:

```ts
const wdayFdoy = mod(subject.wday - (subject.yday - 1), 7);
return div(subject.yday + mod(wdayFdoy + 6 - f, 7), 7);
```

It is correct — verified against `ruby 3.3.11 -rdate` and re-derived
independently in review — but it is a **decomposition deviation**: CLAUDE.md's
"If Rails extracts a private helper, extract it, with the Rails name." A reader
holding `date_core.c:622-632` next to `date.ts` cannot line the two up, and the
correctness argument lives in a comment rather than in the shape.

The same gap blocks anything else that needs a JDN. `cwyear`/`cweek` right
beside it route through `Temporal.PlainDate`'s `yearOfWeek`/`weekOfYear`
instead of `c_jd_to_commercial` (`date_core.c:577-592`) for the same reason:
there is no ported JDN layer to call.

## Converged shape

Port the Julian Day Number layer `date_core.c` actually has, at its Rails
names — `cFindFdoy`, `cJdToCivil`, `cCivilToJd`, `cJdToWeeknum`,
`cJdToCommercial` — and rewrite `wnumx`, `cwyear` and `cweek` as the thin
readers `m_wnumx` / `m_cwyear` / `m_cweek` are, each calling the helper the C
calls. The closed form and the `Temporal` detour both go away.

`sg` (the calendar-reform threshold) is the one argument with no bearer here,
as it already is on `Date.strptime`'s dropped `start` — carry the existing
treatment rather than inventing a new one.

## Acceptance criteria

- [ ] `cJdToWeeknum` and `cFindFdoy` exist at their Rails names and `wnumx` is
      a call to `cJdToWeeknum`, not a closed form.
- [ ] `cwyear` / `cweek` read `cJdToCommercial` rather than
      `Temporal.PlainDate`.
- [ ] `%U`/`%W`/`%V`/`%G`/`%g` answer MRI's values unchanged — the existing
      `date.trails.test.ts` expectations pass untouched, including the
      `2021-01-03` week-year rollback case.
