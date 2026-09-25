---
title: "local-with-env-tz-helpers-onto-shared-date-zone-seat"
status: ready
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`packages/activesupport/src/time-zone-test-helpers.ts` now ports
`TimeZoneTestHelpers#with_env_tz` (`vendor/rails/activesupport/test/time_zone_test_helpers.rb:12-17`)
on top of a `@blazetrails/date` local-zone seat (`resetLocalTimeZoneId(timeZoneId)`,
`packages/date/src/time.ts:31`), with no `process.env`.

Ten test files still carry their own copy of `withEnvTz`, and each one writes
`process.env.TZ` and then calls `resetLocalTimeZoneId()`:

- `packages/activesupport/src/time-ext.trails.test.ts:8`
- `packages/activesupport/src/time-travel.test.ts:20`
- `packages/activesupport/src/core-ext/time-ext.test.ts:121`
- `packages/activesupport/src/time-zone.test.ts:36`
- `packages/activesupport/src/core-ext/date-ext.test.ts:50`
- `packages/activesupport/src/core-ext/time/calculations.test.ts:7`
- `packages/activesupport/src/core-ext/date-and-time-compatibility.test.ts:12`
- `packages/activesupport/src/core-ext/string-ext.test.ts:204`
- `packages/activesupport/src/core-ext/time/calculations.trails.test.ts:5`
- `packages/activerecord/src/base.test.ts:151` (async)

Some of these arms also read the zone through JS `Date` (for example `new Date(2000, 0, 1)`),
which follows `process.env.TZ` and not the `@blazetrails/date` seat. Those reads
have to move to `Time.local` / `Time.at` before the file can switch helpers.

## Acceptance criteria

- [ ] Every activesupport test that ports a Rails `with_env_tz` call imports
      `withEnvTz` from `time-zone-test-helpers.ts`, and no per-file copy is left.
- [ ] activerecord's `base.test.ts` uses a shared async-capable form of the same helper.
- [ ] No `process.env.TZ` write is left in those test files.
