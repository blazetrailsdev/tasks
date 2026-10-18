---
title: "rb-equal-matches-a-ruby-date-against-its-temporal-seat"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

RFC 0088 made `Date.iso8601` / `DateTime.iso8601` (and `Date.today`,
`DateTime.now`) answer Temporal values, with the Ruby-shaped `Date` /
`DateTime` in `packages/date` kept as an opt-in. The two never compare equal:
`rbEqual(new DateTime(2001, 2, 3, 4, 5, 6, "+03:00"), DateTime.iso8601(sameString))`
is `false` in both directions.

Ruby's `Date#==` is `<=>`-based (`vendor/ruby/v3.3.11/ext/date/date_core.c:6902`
`d_lite_equal`, via `d_lite_cmp` at `:6810`), so a Date equals any date value at
the same instant. ruby-compat's Temporal arm
(`packages/ruby-compat/src/rb-equal.ts:110-125`) returns `false` as soon as one
side is not a Temporal value, and the Ruby-shaped class's own `equals` does not
accept a Temporal argument. `packages/date` depends on ruby-compat, so the fix
probably lands on the date side: its `equals` (or a conversion hook ruby-compat
can read) accepts the Temporal seat.

Surfaced by the activejob codegen trial: ActiveJob's
`ArgumentSerializationTest` round-trips a `DateTime.new(...)` through
`DateTimeSerializer`, whose `deserialize` answers `DateTime.iso8601(...)`, and
asserts `assert_equal` (`rbEqual`).

## Acceptance criteria

- `rbEqual` is `true` in both directions for a Ruby `Date` and a
  `Temporal.PlainDate` on the same day, and for a Ruby `DateTime` and a
  `Temporal.ZonedDateTime` / `PlainDateTime` at the same instant; `false` for
  different values. Each pair is checked against MRI (ruby 3.3.11 on PATH).
- `cmp` agrees with `rbEqual` for the same pairs.
