---
title: "Time.new(..., zone) does not accept a TimeZone object (advance, change preserves fractional seconds)"
status: blocked
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-09-24T17:14:05Z"
assignee: "website-sandbox-drops-base-adapter-assignment"
blocked-by: "date's Time seats a zone only as a Temporal IANA id (#timeZoneId, packages/date/src/time.ts #atInstant). Ruby's tz-object protocol (vendor/ruby/time.c zone_timelocal/zone_localtime:2388-2435, find_timezone:2438) keeps the object on the Time and calls local_to_utc/utc_to_local for every field and arithmetic re-resolution (+ 0, change's zone.respond_to?(:utc_to_local) arm, calculations.rb:147). ActiveSupport::TimeZone exposes no IANA identifier through that protocol, so supporting it needs a zone-object seat mode in time.ts beyond this story's 150 LOC; needs its own design story."
closed-reason: null
---

## Context

Parked in `packages/activesupport/src/core-ext/time-ext.test.ts`: `advance` and `change preserves fractional seconds on zoned time`. Both call `Time.new(y, m, d, h, mi, s, ActiveSupport::TimeZone["Moscow"])` (`vendor/rails/activesupport/test/core_ext/time_ext_test.rb:615-617` and `:530`). `Time.new` in `packages/date/src/time.ts:375` types `zone` as `string | number | TimeNewOptions | null`, so a zone object (Ruby's `local_to_utc` / `utc_to_local` protocol) is unsupported. `change preserves...` also needs `Time#inspect` to print `2005-10-30 00:00:00.99 -0400` and `Rational` seconds.

`advance` was parked whole because its 3 new assertions are in the same test body; its other 22 assertions passed before the change.

## Acceptance criteria

- `Time.new` accepts a zone object; `Time#inspect` matches Rails; both tests un-skipped and green.
