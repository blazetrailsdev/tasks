---
title: "i18n-date-parse-frag-and-subx-removal"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps:
  - i18n-date-parse-remaining-sub-parsers
deps-rfc: []
est-loc: null
priority: null
pr: 6085
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`date__parse` (`date-3.4.1/ext/date/date_parse.c:2244-2249`) calls `parse_frag`
(`date_parse.c:2021-2052`) right after `parse_bc`, and `packages/i18n/src/date.ts`
`Date._parse` does not. `parse_frag` matches a _whole-string_ leftover of one or
two digits (`"\\A\\s*(\\d{1,2})\\s*\\z"`) and reads it as the `:mday` when the
string already named an `:hour` but no `:mday`, or as the `:hour` when it named a
`:mday` but no `:hour`. `::Date.parse("11pm 5")` reaches it.

It is the last unported call in the `date__parse` chain (PR #6075 ported the
other seven sub-parsers) and is named by the `@missingRailsCall` receipt on
`Date._parse`.

It is leftover-dependent in a way the other sub-parsers are not: Ruby's `SUBS`
replaces each matched run with a space in the one shared String, so by the time
`parse_frag` runs the string holds only what no earlier sub-parser took. trails'
sub-parsers answer a `DateParts` and leave `str` alone (`date.ts` `parseTime` /
`parseDay` are the two that do return an edited string), so an anchored
whole-string pattern cannot match. Porting `parse_frag` faithfully means giving
the numeric sub-parsers the same `subx` removal Ruby gives them.

## Acceptance criteria

- `Date._parse` runs `parse_frag` where `date__parse` does, after `parse_bc`.
- The numeric sub-parsers remove the text they matched, as `date_parse.c` `subx`
  does, so `parse_frag`'s anchored pattern sees the same leftover Ruby sees.
- `Date._parse` agrees with the interpreter on `"11pm 5"` and `"5 11pm"`.
- The `parse_frag` clause of the `@missingRailsCall` receipt on `Date._parse` is
  removed.
- No regression in the existing `date.trails.test.ts` battery.
