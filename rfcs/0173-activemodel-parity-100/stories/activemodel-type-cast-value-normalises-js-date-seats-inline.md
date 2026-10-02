---
title: "activemodel: Date/DateTime/Time cast_value normalise JS Date and Temporal seats inline, inventing arms"
status: claimed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps:
  - activemodel-converge-invented-control-flow-arms-type
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-10-02T17:42:02Z"
assignee: "activemodel-binary-data-byte-seat-invents-arms"
blocked-by: null
closed-reason: null
---

## Context

Left over from `activemodel-converge-invented-control-flow-arms-type`. Three `cast_value` ports still report invented arms in `pnpm parity:api:arms:report --package=activemodel --direction=invented`, and every one of them is the same shape: a JS `Date` or a `Temporal` value is normalised to the Ruby seat INSIDE the ported body, where Rails receives a `::Time` / `::DateTime` / `::Date` and dispatches.

- `packages/activemodel/src/type/date-time.ts#castValue`. Rails (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/date_time.rb:53-58`) is `return apply_seconds_precision(value) unless value.is_a?(::String)`, `return if value.empty?`, then `fast_string_to_time(value) || fallback_string_to_time(value)`: two arms. The port carries six more: an `instanceof` chain over `Date`, `Temporal.Instant`, `Temporal.PlainDateTime` and `Temporal.ZonedDateTime` building a `Rational` of seconds, an `if (seconds != null)`, and an `isUtc` ternary.
- `packages/activemodel/src/type/date.ts#castValue`. Rails (`type/date.rb:42-51`) is `if value.is_a?(::String)` / `return if value.empty?` / `elsif value.respond_to?(:to_date)` / `else value`: three arms. The port adds a `Temporal.PlainDate` arm (redundant, the `else` already returns it), a `Temporal.PlainDateTime` arm calling `toPlainDate()` (Ruby `DateTime#to_date`), and a JS `Date` arm with a NaN guard (Ruby `Time#to_date`).
- `packages/activemodel/src/type/time.ts#castValue`. Rails (`type/time.rb:72-88`) has three `if` arms and one `begin`/`rescue`. The port adds the same `Temporal.Instant` / `Temporal.PlainDateTime` chain as `date-time.ts`, and splits `fast_string_to_time(dummy_time_value) || begin … end` into `const fast = …; if (fast) return fast;`.

The blocker is where the seat conversion lives, not the arms themselves: `rbObjRespondTo(value, "toDate")` answers false for a `Temporal.PlainDateTime` and a JS `Date`, so `date.rb:46-47`'s one `respond_to?(:to_date)` arm cannot reach them, and nothing upstream of `cast_value` converts a driver's `Date` / `Temporal` value to `@blazetrails/date`'s `Time` first. Decide that once (the callers hand over the Ruby seat, or the seats answer `toDate` / `nsec`), then the three bodies port line for line.

## Acceptance criteria

- [ ] The three `castValue` bodies have Rails' arms and nothing else; no `instanceof Date` / `instanceof Temporal.*` chain remains in them.
- [ ] `time.ts#castValue` keeps `fast_string_to_time(...) || begin … end` as one expression's worth of control flow.
- [ ] `pnpm parity:api:arms:report --package=activemodel --direction=invented` shows no row for `type/date-time.ts#castValue`, `type/date.ts#castValue` or `type/time.ts#castValue`.
