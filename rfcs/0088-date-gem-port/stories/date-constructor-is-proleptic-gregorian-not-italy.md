---
title: "Date/DateTime seat on proleptic Gregorian where Date.new defaults to Date::ITALY, so wday and %s disagree with MRI at and before the reform"
status: done
updated: 2026-08-08
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6250
claim: "2026-08-08T17:40:02Z"
assignee: "date-constructor-is-proleptic-gregorian-not-italy"
blocked-by: null
closed-reason: null
---

## Context

`Date`/`DateTime` are seated on `Temporal.PlainDate`, which is proleptic
Gregorian, where `Date.new` / `DateTime.new` default to `Date::ITALY` — Julian
before 1582-10-15, Gregorian after. So every date at or before the reform
disagrees with MRI on `wday` and on the epoch seconds derived from it.

Measured on ruby 3.3.11 vs trails:

```text
DateTime.new(1, 1, 1)       %A  ruby "Saturday"  trails "Monday"   (2 days)
                            %s  ruby -62135769600  trails -62135596800
DateTime.new(-1, 3, 1)      %A  ruby "Saturday"  trails "Monday"   (2 days)
                            %s  ruby -62193830400  trails -62193657600
DateTime.new(-1234, 3, 1)   %A  ruby "Friday"    trails "Tuesday"  (11 days)
                            %s  ruby -101104329600  trails -101103379200
```

`%u`, `%w`, `%a` and every width-qualified spelling of them carry the same
error, since they all read `wday`.

This is not a `strftime` bug — `strftime` reports what the subject hands it. It
is the calendar the constructor seats the date on. `date-state-onto-temporal-plaindate`
took proleptic Gregorian deliberately, and the existing test "names a day off a
Julian day, as date_s_jd does" pins its expectations against
`Date.jd(jd, Date::GREGORIAN)` rather than the default, which is where the
choice is currently recorded.

Surfaced by the live-MRI differential sweep in PR #6178, which had to exclude
pre-reform subjects to run clean.

## Converged shape

`Date` carries a `start` (`Date::ITALY` = 2299161 by default, with
`Date::GREGORIAN` and `Date::JULIAN` as the other two), as `date_core.c`'s
`dt_lite`/`d_lite` do, and the civil<->jd conversions branch on it
(`vendor/date/ext/date/date_core.c` `c_valid_civil_p` / `c_civil_to_jd`, which
take `sg`). `wday` and the epoch then come off the jd, so every reader agrees
with MRI at and before the reform.

If the full `start` argument is too large for one story, the minimum is that
`wday`/`yday`/epoch go through the jd rather than through `Temporal.PlainDate`'s
proleptic reading, and that the divergence is pinned by a test rather than
worked around by excluding pre-reform dates.

## Acceptance criteria

- [ ] `DateTime.new(1, 1, 1).strftime("%A")` is `"Saturday"`, and the three
      cases above match MRI for `%A`, `%a`, `%u`, `%w` and `%s`.
- [ ] A live-MRI differential over pre-reform subjects runs clean.
- [ ] Post-reform dates are byte-identical to today.
- [ ] Verify each value against a live `ruby -rdate -e`.
