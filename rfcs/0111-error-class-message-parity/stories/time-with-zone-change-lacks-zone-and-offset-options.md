---
title: "time-with-zone-change-lacks-zone-and-offset-options"
status: done
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: trails#7694
claim: "2026-09-11T13:26:35Z"
assignee: "time-with-zone-change-lacks-zone-and-offset-options"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:throws` carries a row for
`activesupport/time-with-zone.ts#change` (`-throw +if +if +if`). Rails'
`TimeWithZone#change` (`vendor/rails/activesupport/lib/active_support/time_with_zone.rb:390-407`)
raises `ArgumentError, "Can't change both :offset and :zone at the same time: #{options.inspect}"`
when both are given, then resolves `new_zone` from `options[:zone]`
(`::Time.find_zone`) or from `new_time.utc_offset` for `options[:offset]`,
falling back to `time_zone`.

Trails' `change` (`packages/activesupport/src/time-with-zone.ts:616`) and its
`ChangeOptions` (`:31-40`) do not accept `zone:` or `offset:` at all, so the
raise has nothing to guard: adding the guard alone would police options the
method silently ignores. Rails' `test_change`
(`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:778-794`)
exercises `change(offset: "-10:00")`, `change(offset: -36000)`,
`change(zone: "Hawaii")`, `change(zone: -10)`, `change(zone: -36000)` and
`change(zone: "Pacific/Honolulu")`; the trails port
(`packages/activesupport/src/core-ext/time-with-zone.test.ts`, "change") covers
only `year:`.

## Acceptance criteria

- [ ] `ChangeOptions` gains `zone` and `offset`; `change` raises Rails'
      `ArgumentError` message when both are given, and resolves `newZone` as
      `time_with_zone.rb:397-403` does (`findZone` from `time-zone-config.ts`).
- [ ] The period lookup and the returned `TimeWithZone` use `newZone`.
- [ ] "change" in `core-ext/time-with-zone.test.ts` carries Rails' zone/offset
      assertions.
- [ ] `pnpm parity:api:arms:throws` green; retire the row with
      `pnpm parity:api:arms:throws:tighten`.
