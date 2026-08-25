---
title: "parse_day sets :wday, as parse_day_cb does"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6089
claim: "2026-08-04T20:32:03Z"
assignee: "i18n-date-parse-day-sets-wday"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/date.ts` `parseDay` replaces the day name with a space and
answers the edited string, dropping the field Ruby records:

```c
/* date-3.4.1/ext/date/date_parse.c:583-592 — parse_day_cb */
set_hash("wday", INT2FIX(day_num(rb_reg_nth_match(1, m))));
```

so `Date._parse` is missing `:wday` wherever the string named a day name:

```text
Date._parse("Wed, 2 Jul 2008")   # Ruby: {wday: 3, year: 2008, mon: 7, mday: 2}
RubyDate._parse("Wed, 2 Jul 2008")  # trails: {year: 2008, mon: 7, mday: 2}
```

Measured as a divergence while verifying PR #6075 against `ruby -rdate` over a
115-string battery; it is one of only two fields that differed on any string.

`Date._parse` is public and `String#to_date` reaches it
(activesupport/lib/active_support/core_ext/string/conversions.rb:47-48), so the
field is missing from every `to_date` caller that inspects the Hash.
`Date.parse` itself does not read `:wday`, which is why nothing fails today.

## Converged shape

- Port `day_num` (`date_parse.c:561-571`, the `ABBR_DAYS` index) and
  `parse_day_cb` (`:583-592`), and have `parseDay` set `:wday` on the hash the
  way `parseTime` already sets its fields — `parseDay`'s signature grows the
  `hash` argument `parse_day(VALUE str, VALUE hash)` has.
- `:wday` joins `DateParts`.

## Acceptance criteria

- `Date._parse` agrees with the interpreter on `"Wed, 2 Jul 2008"`,
  `"Wednesday, July 2, 2008"` and `"sat 2008-07-02"`, `:wday` included.
- No regression in the `date.trails.test.ts` battery.
