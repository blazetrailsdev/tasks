---
title: "MessagePack type 7 is Ruby Time, so write_time_with_zone passes twz.utc"
status: ready
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activesupport", "date"]
deps: []
deps-rfc: []
est-loc: 200
priority: 49
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `naming-residue-burndown-activesupport-structural` by the LOC ceiling. One activesupport `burndown` naming row is in `message-pack/extensions.ts`:

- `writeTimeWithZone` `write_time`: Rails passes `twz.utc` (`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:170-173`). trails passes `twz.utc().toTime().toInstant()`, because `Extensions.writeTime` takes a `Temporal.Instant`.

The row comes from the type-7 seat. Rails registers `Time` (`extensions.rb:55-58`). trails registers `Temporal.Instant` (`packages/activesupport/src/message-pack/extensions.ts`, `type: 7`), so `writeTime` cannot take the `Time` that `TimeWithZone#utc` now returns. Rails' `write_time` (`:159-163`) reads `time.tv_sec`, `time.tv_nsec` and `time.utc_offset`, and `read_time` (`:165-167`) is `Time.at_without_coercion(sec, nsec, :nanosecond, in: offset)`. The `@blazetrails/date` `Time` already has `toI` / `nsec` / `utcOffset`. It does not have `Time.at`'s `(sec, subsec, unit, in:)` arms: `Time.at` takes two arguments (`packages/date/src/time.ts`). This overlaps `messagepack-datetime-time-offset-slot-dropped` (0023), which covers the dropped offset slot.

The Rails test ports as-is once the seat is `Time`: `roundtrips Time` builds `Time.new(1999, 12, 31, 12, 34, 56 + Rational(789, 1000), "-12:00")` (`vendor/rails/activesupport/test/message_pack/shared_serializer_tests.rb`). The trails test builds a `Temporal.Instant`.

## Acceptance criteria

- [ ] Type 7 registers the `@blazetrails/date` `Time`. `writeTime(time, packer)` writes `time.toI()`, `time.nsec` and `time.utcOffset`. `readTime` is `Time.at(sec, nsec, "nanosecond", { in: offset })`, with those `Time.at` arms ported from `vendor/ruby/timev.rb`.
- [ ] `writeTimeWithZone` calls `writeTime(twz.utc(), packer)`.
- [ ] The `roundtrips Time` test builds Rails' `Time.new(...)` value.
- [ ] `pnpm parity:api:calls:args:report` shows no `message-pack/extensions.ts` `writeTimeWithZone` naming row.
