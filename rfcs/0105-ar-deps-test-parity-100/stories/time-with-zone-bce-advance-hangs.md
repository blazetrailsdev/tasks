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

The root cause is one line up, in `getZoneInfo`
(`packages/activesupport/src/values/time-zone.ts:369-410`). It derives the
offset by reformatting the instant in the zone and subtracting, and it reads
the year with `parseInt(localParts.find((p) => p.type === "year").value)`.
`Intl.DateTimeFormat` renders a BCE year as a **positive era-relative number**
(`-008001` prints as `8002`, with the era in a separate part the code never
reads), so `localAsUtc` lands ~16,000 years in the future and the subtraction
yields a nonsense offset. Measured for Eastern at `-008001-12-31T19:00:00Z`:
`abbr` is correctly `GMT-4:56:02`, while `utcOffsetSeconds` is `505005908638`,
and the two ±1-day probes disagree (`505005908638` vs `504942836638`) because
the bogus value tracks the date rather than the offset.

So the fix is in `getZoneInfo` — read the `era` part (or compute the offset
without round-tripping through the formatted year) — not in `periodsForLocal`
or in the `for (;;)`. Note `getZoneInfo` also backs `abbr`, `dst?` and
`utcOffset`, so the change wants its own regression coverage.

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
