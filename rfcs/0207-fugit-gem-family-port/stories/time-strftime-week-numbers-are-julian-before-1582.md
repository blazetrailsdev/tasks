---
title: "time-strftime-week-numbers-are-julian-before-1582"
status: draft
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
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

`Time#strftime` (`packages/date/src/time.ts:1590-1616`) hands Date's shared
`strftime` (`packages/date/src/date.ts:550`) a subject whose `jd` is
`cCivilToJd(this.year, this.mon, this.day)` under the default `ITALY` start.
`%U` / `%W` go through `wnumx` → `cJdToWeeknum(jd, f, DEFAULT_SG)`
(`date.ts:158`, `:3751-3760`), and `%V` / `%G` go through `cJdToCommercial`
(`date.ts:145-156`). Both convert back on the `ITALY` calendar, so a `Time`
before 1582 gets Julian-calendar week numbers.

Ruby's `Time` is proleptic Gregorian. `rb_strftime` computes these from the
vtm's `yday` / `wday`, not from a Julian day: `%U` / `%W` are
`weeknumber_v(vtm, 0|1)` (`vendor/ruby/v3.3.11/strftime.c:507-517`,
`:1114-1142`) and `%V` / `%G` are `iso8601wknum_v` (`:725-745`, `:1105-1110`).

Ruby 3.3.11 against the current port:

| `Time.utc(…).strftime("%U %W %V %G")` | Ruby            | trails          |
| ------------------------------------- | --------------- | --------------- |
| `12, 7, 9`                            | `28 28 28 0012` | `27 27 27 0012` |
| `14, 6, 2`                            | `22 22 23 0014` | `21 22 22 0014` |

The fugit-family differential fuzz (trails#9316, `scripts/fugit-fuzz/`) finds
this through `EtOrbi::EoTime#strftime` on pre-reform stamps, e.g.
`"012-07-11Z"` and `"2L014-06-04T07:47:29 -09:00"` (seed 20261025, eo surface).

## Acceptance criteria

- `Time#strftime`'s `%U`, `%W`, `%V` and `%G` agree with Ruby for dates before
  the 1582 reform: the two rows above, plus a year just before and after 1582.
- Date's own `strftime` path is unchanged: a `Date` / `DateTime` still uses its
  own start (`ITALY` by default), as `date_strftime.c` does.
- A regression test in `packages/date` with Ruby's answers, which fails on the
  current code.
- The eo `[4] string vs string` group is gone from
  `TZ=UTC pnpm tsx scripts/fugit-fuzz/fuzz.ts --seed 20261025 --count 2000 --surface eo`.
