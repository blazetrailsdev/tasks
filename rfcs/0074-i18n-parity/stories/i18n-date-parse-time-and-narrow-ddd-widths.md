---
title: "Port parse_time so Date.parse reads the yday and bare-mday widths"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6070
claim: "2026-08-04T16:19:08Z"
assignee: "i18n-date-parse-time-and-narrow-ddd-widths"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/date.ts` `parseDdd` (landed by PR #6056) reads only the
all-digit widths that name a month: 4 (`mmdd`), 6 (`yymmdd`), and 8/10/12/14
(`yyyymmdd` plus a discarded time). The widths that name no month — 2 (a bare
`:mday`) and 3/5/7 (a `:yday`) — return `null`, so `Date.parse("102")` and
`Date.parse("02")` raise where Ruby answers this year's 12 April and 2nd of
this month (verified against the interpreter).

The blocker is `parse_time` (ruby/date `date_parse.c`, called from
`date__parse` before the numeric sub-parsers). Ruby removes the time-of-day
text from the string first, so `parse_ddd` never sees it. Without that removal
trails would read the minutes of `"07.2008"` — which Ruby rejects — as a day of
the month, which is why the narrow widths were left raising rather than
guessing. The narrowing is stated at the call site with a `@missingRailsCall`
tag on `parseDdd`.

Ruby references:

- `date_parse.c` `parse_time` / `parse_time_cb` — the time-of-day matcher and
  the text it deletes.
- `date_parse.c:1815-1853` `parse_ddd_cb` — the width table, including the 2/3/5/7
  cases.
- `date_core.c:4021-4036` `rt_complete_frags` — already ported as `completeFrags`,
  and what fills the year for a `:yday`-only or `:mday`-only fragment.

## Converged shape

Port `parse_time` as a module-private function in `packages/i18n/src/date.ts`,
called from `Date._parse` in Ruby's order (before the alphabetic and numeric
sub-parsers), returning the string with the time text removed. Then extend
`parseDdd` to the 2-, 3-, 5- and 7-digit widths, and teach `Date.parse` to
build an ordinal date when the parts carry `:yday` rather than `:mon`/`:mday`.
Delete the `@missingRailsCall` tag on `parseDdd` when it is no longer true.

## Acceptance criteria

- `Date.parse("102")`, `Date.parse("02")`, `Date.parse("20080")` and
  `Date.parse("2008070")` agree with Ruby.
- `Date.parse("07.2008")` still raises `ArgumentError("invalid date")`.
- The `@missingRailsCall` receipt on `parseDdd` is removed, not reworded.
- A trails test per newly accepted width in `packages/i18n/src/date.trails.test.ts`.
