---
title: "ruby-compat/date: a Temporal.PlainDate seat and the Date it seats are not == in both directions, nor one Hash key"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `marshal-cannot-round-trip-rational-or-date`. A `Temporal.PlainDate` is the seat of
`Date`: `rbObjClass` answers `rbCDate` for it (`packages/ruby-compat/src/object.ts:50`). That story
made `Date#<=>` (`packages/date/src/date.ts`, `d_lite_cmp`,
`vendor/ruby/v3.3.11/ext/date/date_core.c:6733-6766`) read a `Temporal.PlainDate` operand as the
Date it seats, so `rubyDate.equals(plainDate)` is true. The other direction is not:
`rbEqual(Temporal.PlainDate.from("2016-01-01"), new Date(2016, 1, 1))` is `false`
(`packages/ruby-compat/src/rb-equal.ts`), where Ruby's `Date#==` is `Comparable#==` over the same
`<=>` (`vendor/ruby/v3.3.11/compar.c:79-86`) and is symmetric between two Dates. Measured in that
PR's probe: `Marshal.load(Marshal.dump(plainDate))` answers a `Date` with
`loaded.equals(plainDate) === true` and `rbEqual(plainDate, loaded) === false`.

`Date#===` (`caseEquals`, `d_lite_equal`, `date_core.c:6798-6820`), `Date#eql?` and `Date#hash`
(`date_core.c:6824-6853`) take the same `k_date_p(other)` test and still answer a
`Temporal.PlainDate` operand through `equal_gen` / as not a Date.

## Acceptance criteria

- [ ] `rbEqual(plainDate, date)` and `rbEqual(date, plainDate)` agree for a `Temporal.PlainDate`
      and the `Date` it seats, as do `cmp` in both directions.
- [ ] `Date#===`, `Date#eql?` and `Date#hash` read a `Temporal.PlainDate` operand as the Date it
      seats, so the two are one `Hash` key (`rbHash` / `rbEql`).
