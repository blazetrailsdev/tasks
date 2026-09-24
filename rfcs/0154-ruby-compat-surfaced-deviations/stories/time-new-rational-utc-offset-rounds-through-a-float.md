---
title: "Time.new rounds a Rational utc_offset through toF where MRI keeps it exact (num_exact)"
status: draft
updated: 2026-09-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8051. That PR let `@blazetrails/date`'s `Time.new` take a Rational `utc_offset`, so that `TimeZone#iso8601` / `#rfc3339` / `#parts_to_time` (`activesupport/lib/active_support/values/time_zone.rb:416-424,476-484,592-600`) can pass `parts.fetch(:offset, 0)`. `Date._parse` returns a Rational there for sub-second zone offsets (`dateZoneToDiff`, `packages/date/src/date.ts:827`).

MRI keeps that offset exact. `utc_offset_arg` (`vendor/ruby/time.c:2198`) ends in `num_exact(arg)` for any numeric, and the Rational is stored as-is in `vtm.utc_offset`, so `Time.new(2000, 1, 1, 0, 0, 0, Rational(1, 3)).utc_offset` answers `(1/3)`. trails' `utcOffsetArgument` (`packages/date/src/time.ts:44`) converts it with `zone.toF()`, and `#utcOffsetMemo` is a `number`. So `utcOffset` answers a float, and the instant `Time` derives is rounded to the nanosecond through a double.

## Converged shape

`utcOffsetArgument` returns an exact offset: a Rational for a non-integer offset, or an Integer. `Time` carries it in its offset seat, so `utcOffset` answers `Rational(1, 3)` for that input, and the instant is computed from the exact value.

## Acceptance criteria

- [ ] `Time.new(2000, 1, 1, 0, 0, 0, new Rational(1, 3)).utcOffset` equals `new Rational(1, 3)`, checked against `ruby`.
- [ ] An integer offset still answers a number.
