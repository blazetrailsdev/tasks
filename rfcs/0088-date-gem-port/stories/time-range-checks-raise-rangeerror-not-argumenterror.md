---
title: "::Time's non-sec range checks raise Temporal's RangeError, not MRI's ArgumentError"
status: done
updated: 2026-08-13
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6473
claim: "2026-08-13T16:05:43Z"
assignee: "route-update-record-through-update-row"
blocked-by: null
closed-reason: null
---

## Context

Found while landing `time-cannot-hold-a-leap-second` (#6332). That PR added
the one range check MRI's `::Time` makes that `Temporal` does not — the 60th
second — as

```ts
if (wholeSec > 60) throw new ArgumentError("sec out of range");
```

(`packages/date/src/time.ts`, the constructor). Every OTHER out-of-range
positional still falls through to `Temporal.PlainDateTime`'s own `RejectTime` /
`RejectISODate`, which raises a `RangeError` with a Temporal message. MRI
raises `ArgumentError` with its own per-field wording (ruby 3.3.11, `time.c`
`time_arg` / `validate_vtm`):

```ruby
Time.utc(2015, 6, 30, 23, 60, 0) #=> ArgumentError: min out of range
Time.utc(2015, 13, 1)            #=> ArgumentError: mon out of range
Time.utc(2015, 6, 32)            #=> ArgumentError: argument out of range
```

trails answers, respectively, `RangeError: value out of range: 0 <= 60 <= 59`,
and Temporal's own ISO-date rejections — a different class and a different
message, so a caller rescuing `ArgumentError` (which is what Rails' own
`Time` coercion paths do) does not catch them.

`ArgumentError` is already imported in `time.ts` and is what the `sec` arm
raises, so the classes are inconsistent WITHIN the constructor today: `sec`
61 is an `ArgumentError` and `min` 60 is a `RangeError`.

## Converged shape

Range-check `mon`, `mday`, `hour` and `min` ahead of the `Temporal.PlainDateTime`
construction the same way `sec` already is, raising `ArgumentError` with MRI's
message for each field — `"mon out of range"`, `"argument out of range"` (mday),
`"hour out of range"`, `"min out of range"`. The bounds are MRI's, not
Temporal's: `mon` 1..12, `mday` 1..31 with the month-length check left to
Temporal, `hour` 0..24, `min` 0..59, `sec` 0..60 (already done).

Note MRI's `hour` upper bound is 24, not 23 — `Time.utc(2015, 6, 30, 24)` is
valid and rolls to the next day, the same shape the `sec == 60` roll takes.

## Acceptance criteria

- [ ] `Time.utc(2015, 6, 30, 23, 60, 0)` raises `ArgumentError("min out of range")`.
- [ ] `Time.utc(2015, 13, 1)` raises `ArgumentError("mon out of range")`.
- [ ] `Time.utc(2015, 6, 32)` raises `ArgumentError("argument out of range")`.
- [ ] `Time.utc(2015, 6, 30, 24)` constructs and rolls to `2015-07-01 00:00:00`.
- [ ] The existing `sec` arm (`> 60` → `ArgumentError`, `=== 60` → roll) is
      unchanged, and its test in `packages/date/src/date.trails.test.ts` still
      passes.
- [ ] Covered in `packages/date/src/time.trails.test.ts` alongside the other
      constructor coverage.
