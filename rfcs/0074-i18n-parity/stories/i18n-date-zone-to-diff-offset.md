---
title: "i18n-date-zone-to-diff-offset"
status: blocked
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-04T16:59:40Z"
assignee: "i18n-date-zone-to-diff-offset"
blocked-by: "Blocked on unmerged PR #6070 (i18n-date-parse-time-and-narrow-ddd-widths). Both call sites this story converges are introduced by that PR, not by origin/main (1a6ee75e0): (1) DateParts has no `zone` field on main — #6070 adds it plus parse_time_cb/parse_ddd_cb zone capture; (2) the `@missingRailsCall` receipt naming date_zone_to_diff that acceptance criterion 3 says to remove does not exist on main — #6070 writes it. Acceptance criterion 1 (`Date._parse('20080702[+9:JST]')` answers offset 32400, and the same for '2008-07-02T10:30:00+09:00') is unreachable without #6070's bracketed-zone and parse_time ports. Porting date_zone_to_diff alone on main would be dead extra surface with no call site, which api:extra measures and CLAUDE.md forbids; the alternative is a stacked PR, also forbidden. Unblock and re-run once #6070 merges."
closed-reason: null
---

## Context

`packages/i18n/src/date.ts` `Date._parse` carries a `@missingRailsCall` for
`date_zone_to_diff` (ruby/date `date_parse.c:416-559`), the function that turns
a `:zone` — `"+09:00"`, `"gmt+9"`, `"JST"`, `"Pacific Standard Time"` — into the
`:offset` in seconds that Ruby's Hash also answers.

It is missing from both of its call sites:

- the tail of `date__parse` itself (`date_parse.c:2290-2294`), which sets
  `:offset` whenever a sub-parser found a `:zone` and no offset;
- the bracketed zone of `parse_ddd_cb` (`date_parse.c:1934-1960`), where
  `"20080702[+9:JST]"` answers `:zone => "JST"` and `:offset => 32400`. trails
  answers the `:zone` (ported by PR #6070) and no `:offset`.

`Date.parse` discards the time of day and the zone with it, so nothing in trails
reads `:offset` today — but `Date._parse` is the public Hash, and a `::Time` or
`::DateTime` parser built on it would need the field.

The port needs the numeric spellings and the zone-name table `zonetab` resolves
(`date-3.4.1/ext/date/zonetab.list`), plus the `standard`/`daylight`/`dst`
suffix handling at the head of `date_zone_to_diff`.

## Acceptance criteria

- `Date._parse("20080702[+9:JST]")` answers `offset: 32400`, and
  `Date._parse("2008-07-02T10:30:00+09:00")` answers the same, both matching the
  interpreter.
- The named spellings `date_zone_to_diff` accepts — `"gmt+9"`, `"JST"`,
  `"Pacific Standard Time"`, `"JST dst"` — resolve as Ruby resolves them.
- The `@missingRailsCall` receipt on `Date._parse` naming `date_zone_to_diff` is
  removed, not reworded.
