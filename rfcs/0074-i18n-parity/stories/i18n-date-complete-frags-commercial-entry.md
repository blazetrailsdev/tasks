---
title: "Carry rt_complete_frags' commercial entry so Date.parse builds a week date"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6088
claim: "2026-08-04T20:08:08Z"
assignee: "i18n-date-complete-frags-commercial-entry"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/date.ts` `completeFrags` carries only three of the entries in
`rt_complete_frags`' table (`date-3.4.1/ext/date/date_core.c:3878-3892`):
`:time`, `:ordinal` and `:civil`. Its own JSDoc says the rest "are the
Julian-day, commercial and week-numbered dates, none of which any sub-parser
ported here can produce" — that is no longer true. PR #6075 ported `parse_iso21`
and `parse_iso22` (`date_parse.c:1035-1099`), so `Date._parse` now answers
`:cwyear` / `:cweek` / `:cwday`:

```text
Date._parse("2001-W05-6")  #=> {cwyear: 2001, cweek: 5, cwday: 6}
```

`Date.parse("2001-W05-6")` is 2001-02-03 in the interpreter and raises
`Date::Error` in trails, because `completeFrags` has no commercial entry and
`Date.parse` (`date.ts` `parse`) only knows how to build from `:year`+`:yday`
or `:year`+`:mon`+`:mday`. `"-W061"` (`{cweek: 6, cwday: 1}`) is the same gap
with the year completed from today.

## Converged shape

- Add the commercial entry (`["commercial", ["cwyear", "cweek", "cwday", "hour",
"min", "sec"]]`) to `completeFrags`' table in its `date_core.c` position, with
  the completion branch `rt_complete_frags` gives it (`date_core.c:3960-4036`):
  the fields above the highest named come from `Date.today`'s commercial date,
  the ones below are `1`.
- `Date.parse` builds the commercial date where `rt__valid_date_frags_p`
  (`date_core.c:4185-4220`) does — after the ordinal arm, before the civil one.
- The Julian-day and week-numbered entries stay out until a sub-parser can
  produce their fields; say so in the JSDoc rather than leaving the stale claim.

## Acceptance criteria

- `Date.parse` agrees with the interpreter on `"2001-W05-6"`, `"-W061"`,
  `"01-W05-6"` and `"2001-W05"`.
- The `completeFrags` JSDoc no longer claims no ported sub-parser produces
  commercial fields.
- No regression in the `date.trails.test.ts` battery.
