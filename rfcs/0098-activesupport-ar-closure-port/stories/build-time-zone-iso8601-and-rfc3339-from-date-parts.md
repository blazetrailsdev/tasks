---
title: "Build TimeZone#iso8601 and #rfc3339 from Date._iso8601/_rfc3339 parts"
status: ready
updated: 2026-08-22
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds `TimeZone#iso8601` (`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:396-433`)
and `TimeZone#rfc3339` (`:469-484`) the same way `parse` and `strptime` are
built: parse the string into a parts Hash with ruby/date, then assemble a
`Time` from `parts.fetch(...)` and wrap it.

```ruby
def iso8601(str)
  raise ArgumentError, "invalid date" if str.nil?
  parts = Date._iso8601(str)
  year = parts.fetch(:year)
  if parts.key?(:yday)
    ordinal_date = Date.ordinal(year, parts.fetch(:yday))
    month = ordinal_date.month
    day   = ordinal_date.day
  else
    month = parts.fetch(:mon)
    day   = parts.fetch(:mday)
  end
  time = Time.new(year, month, day, parts.fetch(:hour, 0), parts.fetch(:min, 0),
                  parts.fetch(:sec, 0) + parts.fetch(:sec_fraction, 0), parts.fetch(:offset, 0))
  if parts[:offset] then TimeWithZone.new(time.utc, self)
  else                   TimeWithZone.new(nil, self, time)
  end
rescue Date::Error, KeyError
  raise ArgumentError, "invalid date"
end
```

trails' two (`packages/activesupport/src/values/time-zone.ts`) are bespoke
instead: `iso8601` hand-matches an ordinal-date regex, then a shape regex, then
delegates to `parse`; `rfc3339` matches its own regex and builds from
`new Date(trimmed)`. Both raise a bare `Error("invalid date")` rather than
`ArgumentError`, and `rfc3339` inherits `new Date`'s millisecond floor.

Both preconditions this needs are now in place, which is why it is worth
filing now rather than earlier:

- `Date._iso8601` and `Date._rfc3339` are ported
  (`packages/date/src/date.ts:6884`, `:6901`) and answer the same `DateParts`
  the rest of this path already consumes.
- PR #6848 ported `partsToTime` (`time_zone.rb:585-608`) and put `parse` and
  `strptime` on it. The tail of both bodies above — the `Time.new(...)` build
  with those exact `fetch` defaults, and the `parts[:offset]` UTC-vs-local
  wrap — is the same tail `partsToTime` already implements.

## Converged shape

`iso8601` and `rfc3339` read their parts from `RubyDate._iso8601` /
`RubyDate._rfc3339` and reach the shared build, keeping Rails' distinguishing
guards: `iso8601`'s nil check, `:yday` ordinal-date arm, and
`Date::Error, KeyError -> ArgumentError, "invalid date"` rescue; `rfc3339`'s
`raise ArgumentError, "invalid date" if parts.empty?` and its stricter
non-defaulting `fetch`es (a missing hour or offset is an error there, not a
zero). Note `rfc3339` always takes the UTC arm — it has no local branch.

Both then answer Rails' `ArgumentError`, not a bare `Error`, and pick up
nanosecond resolution from `sec_fraction` for free.

## Acceptance criteria

- [ ] `iso8601` and `rfc3339` are built from `_iso8601` / `_rfc3339` parts and
      the shared `partsToTime` tail, with each method's own guards intact and
      in Rails' order.
- [ ] Both raise `ArgumentError("invalid date")` where Rails does, including
      `rfc3339` on a date-only string and `iso8601` on nil.
- [ ] `iso8601`'s `:yday` ordinal arm keeps its current coverage.
- [ ] Sub-millisecond digits survive both, with a test.
