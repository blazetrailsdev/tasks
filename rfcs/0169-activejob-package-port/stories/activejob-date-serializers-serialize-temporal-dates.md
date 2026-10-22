---
title: "activejob-date-serializers-serialize-temporal-dates"
status: ready
updated: 2026-10-22
rfc: "0169-activejob-package-port"
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

`ArgumentSerializationTest` "serializes - verbatim"
(`vendor/rails/v8.0.2/activejob/test/cases/argument_serialization_test.rb:51-80`)
round-trips `10.days.ago..Date.today` and
`(DateTime.current - 4.weeks)..DateTime.current`. In trails `Date.today`
(`packages/date/src/date.ts:4820`) answers a `Temporal.PlainDate` and
`DateTime.current` (`packages/activesupport/src/core-ext/date-time/calculations.ts:15`)
a `Temporal.PlainDateTime | ZonedDateTime`. `rbObjClass` classes those as
`Date` / `DateTime`, so `DateSerializer` / `DateTimeSerializer` are chosen, but
their `serialize` (`packages/activejob/src/serializers/date-serializer.ts`,
`time-object-serializer.ts`) calls `date.iso8601()`, which a Temporal value
does not answer (`TypeError: date.iso8601 is not a function`). Rails'
`DateSerializer#serialize` is `super("value" => date.iso8601)`
(`vendor/rails/v8.0.2/activejob/lib/active_job/serializers/date_serializer.rb:6-8`).

## Acceptance criteria

- [ ] A Temporal-valued Ruby Date / DateTime serializes through
      `DateSerializer` / `DateTimeSerializer` with Rails' `iso8601` value, by a
      direct call (no new string-literal send).
- [ ] `packages/activejob/src/argument-serialization.test.ts`'s
      "serializes - verbatim" is un-skipped and green in every AJ lane.
