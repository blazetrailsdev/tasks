---
title: "date-ext-calendar-reform-cases-assert-proleptic-values"
status: draft
updated: 2026-09-07
rfc: "0105-ar-deps-test-parity-100"
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

`DateAndTime::Calculations`' week math is seated on `Temporal.PlainDate`, which
is proleptic Gregorian, so every `date_ext_test.rb` calendar-reform case asserts
a different day from MRI. Seven cases in
`packages/activesupport/src/core-ext/date-ext.test.ts` now carry the diverged
values — four pre-existing (`yesterday`, `tomorrow`, `last year`, `advance` in
calendar reform) and three added by #7582 (`beginning of week`, `end of week`,
`next week in calendar reform`).

**The underlying reform seat is no longer the blocker.** RFC 0088's
`date-constructor-is-proleptic-gregorian-not-italy` (done, PR #6250) gave `Date`
a `start`, and its `wday` now agrees with MRI across the reform. Measured:

```text
                      MRI (ruby -rdate)   trails RubyDate#wday
Date.new(1582,10,15)          5                   5
Date.new(1582,10,4)           4                   4
Date.new(1582,9,30)           0                   0
```

What is missing is downstream: `beginningOfWeek` / `endOfWeek` / `nextWeek`
(`packages/activesupport/src/core-ext/date-and-time/calculations.ts:290-300,390-396`)
take `Temporal.PlainDate | Date` and operate with `PlainDate#add`, so handing
one a reform-aware `Date` throws `TypeError: d.add is not a function`. The
helpers cannot see the `start` seat that already exists one package down.

MRI values the ported cases should assert
(`vendor/rails/activesupport/test/core_ext/date_ext_test.rb:100-106,166-169`),
verified against a live `ruby -Ilib -e` with activesupport loaded:

```text
Date.new(1582,10,15).beginning_of_week  => 1582-10-01   (trails today: 1582-10-11)
Date.new(1582,10,4).end_of_week         => 1582-10-17   (trails today: 1582-10-10)
Date.new(1582,9,30).next_week(:friday)  => 1582-10-15   (trails today: 1582-10-08)
Date.new(1582,10,4).next_week           => 1582-10-18   (trails today: 1582-10-11)
```

## Acceptance criteria

- The `DateAndTime::Calculations` week/advance helpers accept a reform-aware
  `Date` and route their day arithmetic through its jd rather than through
  `Temporal.PlainDate`'s proleptic reading.
- All seven `date-ext.test.ts` calendar-reform cases assert the MRI values above
  rather than the proleptic ones, verified against a live `ruby -rdate -e`.
- Post-reform dates are byte-identical to today.
