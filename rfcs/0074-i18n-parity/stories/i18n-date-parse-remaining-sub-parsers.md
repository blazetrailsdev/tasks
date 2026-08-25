---
title: "Port the seven date__parse sub-parsers Date._parse still omits"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6075
claim: "2026-08-04T17:09:59Z"
assignee: "i18n-date-parse-remaining-sub-parsers"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/date.ts` `Date._parse` carries a `@missingRailsCall` naming
seven sub-parsers `date__parse` runs that trails does not
(`date-3.4.1/ext/date/date_parse.c:2205-2233`, in Ruby's own order):

- `parse_jis` (`date_parse.c:1215-1240`) — the Japanese era date, `"H13.02.03"`.
- `parse_vms` (`date_parse.c:1287-1317`) — `"3-FEB-2001"` / `"FEB-3-2001"`.
- `parse_iso2` (`date_parse.c:1560-1667`) — the ISO spellings `parse_iso` does
  not take: `"2001-W05-6"`, `"-W061"`, `"2001-034"`, `"--0203"`.
- `parse_year` (`date_parse.c:1673-1699`), `parse_mon` (`:1703-1729`) and
  `parse_mday` (`:1733-1759`) — the one-fragment strings `"'01"`, `"Feb"`,
  `"3rd"`, each tried before `parse_ddd`.
- `parse_bc` (`date_parse.c:2005-2030`) — the `"BC"` / `"B.C.E."` suffix that
  negates the year, applied after whichever sub-parser matched.

Their absence is observable: `::Date.parse("3rd")` answers the 3rd of this
month and trails raises, and `::Date.parse("2001-034")` is an ordinal date
trails reads as a civil one. `parse_mday` in particular sits directly above
`parse_ddd` in the chain, so it takes strings the newly widened `parse_ddd`
(PR #6070) now answers instead.

`Date._parse` is public and `String#to_date` reaches it through
`::Date.parse(self, false)`
(activesupport/lib/active_support/core_ext/string/conversions.rb:47-48), so
every spelling Rails users hand to `to_date` runs this chain.

## Converged shape

Port the seven as module-private functions in `packages/i18n/src/date.ts`,
named and ordered as `date__parse` calls them, each answering its `DateParts`
the way the ported sub-parsers already do (`parse_bc` sets `:_bc`, consumed by
the `del_hash("_bc")` arm at `date_parse.c:2253-2265`, which also needs
porting). Delete the `@missingRailsCall` on `Date._parse` naming them when it
is no longer true.

Likely more than one PR: `parse_iso2` alone is four spellings with the
commercial-week fields `rt_complete_frags` does not yet carry. Split by
sub-parser if it does not fit under the ceiling.

## Acceptance criteria

- `Date.parse` agrees with the interpreter on `"3rd"`, `"Feb"`, `"'01"`,
  `"3-FEB-2001"`, `"H13.02.03"`, `"2001-034"` and `"4004 BC"`.
- No regression in the widths PR #6056 and #6070 established — the existing
  `date.trails.test.ts` battery keeps passing unchanged.
- The `@missingRailsCall` receipt on `Date._parse` naming these sub-parsers is
  removed, not reworded.
