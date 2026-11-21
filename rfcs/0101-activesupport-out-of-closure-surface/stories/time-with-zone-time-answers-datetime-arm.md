---
title: "TimeWithZone#time: type as Time | DateTime, drop as Time casts"
status: draft
updated: 2026-11-21
rfc: "0101-activesupport-out-of-closure-surface"
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

Rails' `TimeWithZone#time` is `@time ||= incorporate_utc_offset(@utc, utc_offset)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/time_with_zone.rb:58-60`). It can return a DateTime when the caller passed a DateTime local time, and `incorporate_utc_offset`'s `Date` arm (`:599-605`) keeps it as one. trails#10472 kept `get time(): Time` with an `as Time` cast, and `periodForLocal(this._time as Time)` likewise. Widening the getter to `Time | DateTime` reds about six readers in `packages/activesupport/lib/time-with-zone.ts`, which assume Time: for example, DateTime's `year` is a `bigint`.

## Acceptance criteria

- `get time()` is typed `Time | DateTime`, and its readers handle the DateTime arm as Rails' duck typing does. There is no `as Time` on `time` or on `periodForLocal`.
- The time-with-zone suites stay green.
