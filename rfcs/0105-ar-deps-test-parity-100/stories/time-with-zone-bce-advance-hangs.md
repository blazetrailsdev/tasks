---
title: "time-with-zone-bce-advance-hangs"
status: draft
updated: 2026-09-07
rfc: "0105-ar-deps-test-parity-100"
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

`TimeWithZone#-` with a multi-millennium `Duration` **hangs the process**, so
`core_ext/time_with_zone_test.rb`'s `test_no_limit_on_times`
(`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:397-401`)
cannot be ported. It is the last stub in that file after
`port-date-and-time-compatibility-and-zone-cases` (#PR).

The Rails case is:

```ruby
twz = ActiveSupport::TimeWithZone.new(Time.utc(2000, 1, 1), @time_zone)
assert_equal [0, 0, 19, 31, 12, 11999], (twz + 10_000.years).to_a[0, 6]
assert_equal [0, 0, 19, 31, 12, -8001], (twz - 10_000.years).to_a[0, 6]
```

The forward half works. The backward half does not, and the loop is exact:

- `TimeWithZone#advance` (`packages/activesupport/src/time-with-zone.ts:602-610`)
  routes a `years:` advance through `_wrapWithTimeZone`
  (`:222-241`), which constructs `new TimeWithZone(null, zone, local, null)`.
- With no `utc` seat the constructor calls
  `_getPeriodAndEnsureValidLocalTime` (`:183-195`), whose `for (;;)` retries
  `periodForLocal` and adds an hour on every `PeriodNotFound`.
- `TimeZone#periodsForLocal` (`packages/activesupport/src/values/time-zone.ts:527-543`)
  returns **`[]`** for a BCE local time, so `periodForLocal` throws
  `PeriodNotFound` forever and the hour-bump never converges. Measured directly:

  ```text
  Eastern Time (US & Canada), Time.utc(11999, 12, 31, 19) -> [{abbreviation:"GMT-5",observedUtcOffset:-18000,dst:false}]
  Eastern Time (US & Canada), Time.utc(-8001, 12, 31, 19) -> []
  ```

  `periodsForLocal` builds its candidate offsets from `getZoneInfo` at
  `localMs ± 1 day` and keeps a candidate only when
  `getZoneInfo(localMs - offset*1000)` reports that same offset (`:536-541`).
  For a BCE instant that round-trip never agrees, so the candidate list empties.

Because the failure is a non-interruptible synchronous loop, a `testTimeout`
does not rescue it — the vitest worker never returns — which is why the case
stays an `it.skip` stub rather than a failing test.

## Acceptance criteria

- `periodsForLocal` returns a period for a BCE local time (or
  `_getPeriodAndEnsureValidLocalTime` terminates), so
  `twz.minus(Duration.years(10_000))` returns instead of hanging.
- `it.skip("no limit on times")` in
  `packages/activesupport/src/core-ext/time-with-zone.test.ts` becomes a real
  test asserting Rails' `[0, 0, 19, 31, 12, 11999]` and
  `[0, 0, 19, 31, 12, -8001]`.
- `pnpm parity:test -- --package activesupport` shows
  `core_ext/time_with_zone_test.rb` at 0 skipped.
