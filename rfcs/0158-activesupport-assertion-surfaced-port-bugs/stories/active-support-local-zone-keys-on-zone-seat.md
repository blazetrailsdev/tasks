---
title: "activeSupportLocalZone keys its memo on the date zone seat, not on the value it memoizes"
status: draft
updated: 2026-11-04
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `active_support_local_zone` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/compatibility.rb:32-39`) memoizes `Time.new.zone` in `@@active_support_local_zone`, keyed on `@@active_support_local_tz = ENV["TZ"]`. It recomputes only when `ENV["TZ"]` changes.

trails' `activeSupportLocalZone` (`packages/activesupport/src/core-ext/time/compatibility.ts`) has no `ENV["TZ"]`. trails#9731 moved it off `Temporal.Now.timeZoneId()`, but it now keys on `RubyTime.now().zone`, the very value it memoizes. So `Time.now` runs on every call and the memo is vacuous. The analogue of `ENV["TZ"]` is the `@blazetrails/date` local-zone seat (`localTimeZoneId`, which `resetLocalTimeZoneId` sets, `packages/date/src/time.ts:47-70`), and nothing outside `time.ts` can read it.

## Acceptance criteria

- `_activeSupportLocalTz` is keyed on the zone-seat id, read without building a `Time`. `_activeSupportLocalZone` is recomputed from `Time.now.zone` only when that id changes, as `compatibility.rb:32-39` does.
- The `date-and-time-compatibility.test.ts` cases under `withEnvTz` stay green.
