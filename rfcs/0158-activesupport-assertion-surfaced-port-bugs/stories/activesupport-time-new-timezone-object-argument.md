---
title: "Time.new(..., zone) does not accept a TimeZone object (advance, change preserves fractional seconds)"
status: blocked
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps:
  - date-time-seats-a-timezone-object-zone
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-09-24T17:14:05Z"
assignee: "website-sandbox-drops-base-adapter-assignment"
blocked-by: "Blocked on date-time-seats-a-timezone-object-zone: @blazetrails/date Time seats a zone only as an IANA id or offset (packages/date/src/time.ts), so Time.new cannot keep an ActiveSupport::TimeZone object and re-resolve through local_to_utc / utc_to_local as time.c find_timezone does."
closed-reason: null
---

## Context

Parked in `packages/activesupport/src/core-ext/time-ext.test.ts`: `advance` and `change preserves fractional seconds on zoned time`. Both call `Time.new(y, m, d, h, mi, s, ActiveSupport::TimeZone["Moscow"])` (`vendor/rails/activesupport/test/core_ext/time_ext_test.rb:615-617` and `:530`). `Time.new` in `packages/date/src/time.ts` types `zone` as `string | number | TimeNewOptions | null`, so a zone object (Ruby's `local_to_utc` / `utc_to_local` protocol) is unsupported. `change preserves...` also needs `Time#inspect` to print `2005-10-30 00:00:00.99 -0400` and `Rational` seconds.

`advance` was parked whole because its 3 new assertions are in the same test body; its other 22 assertions passed before the change.

## Acceptance criteria

- `Time.new` accepts a zone object; `Time#inspect` matches Rails; both tests un-skipped and green.
