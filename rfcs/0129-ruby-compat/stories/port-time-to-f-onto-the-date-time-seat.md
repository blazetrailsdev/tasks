---
title: "Port Time#to_f onto @blazetrails/date's Time"
status: claimed
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: "2026-09-05T03:42:13Z"
assignee: "fast-string-to-time-construct-through-time-new"
blocked-by: null
closed-reason: null
---

## Context

`Time#to_f` (`vendor/ruby/time.c`, `time_to_f` — the Float seconds-since-epoch
reader) has no port on `packages/date/src/time.ts`. The class has `toI()`
(`time.ts:1011`) and `toR()` (`time.ts:1017`) but no `toF()`.

Surfaced while porting `TimeExtMarshalingTest#test_marshalling_preserves_fractional_seconds`
(`vendor/rails/activesupport/test/core_ext/time_ext_test.rb:1417-1421`) in #7500,
whose body is:

```ruby
assert_equal t.to_f, unmarshalled.to_f
```

The port had to spell it `unmarshalled.toR().toF()` — Ruby's own `to_r` → Float
route, correct in value but not the method Rails calls, and it leaves
`packages/activesupport/src/core-ext/time-ext.test.ts` naming a member that does
not exist on the receiver Rails uses.

`Rational#toF` already exists (`packages/ruby-compat/src/rational.ts:222`), so
the reader is a thin one.

## Acceptance criteria

- `Time#toF()` exists on `packages/date/src/time.ts`, returning the Float
  seconds since the epoch, placed in Rails/MRI source order beside `toI` and
  `toR`.
- Its value matches MRI for a fractional time — check against `ruby` on PATH,
  e.g. `Time.parse("00:00:00.500").to_f`, rather than deriving it.
- `test_marshalling_preserves_fractional_seconds` in
  `packages/activesupport/src/core-ext/time-ext.test.ts` calls `toF()` directly
  instead of `toR().toF()`.
- `pnpm parity:api` deltas non-negative; the new name has a Ruby counterpart so
  it must not raise `parity:api:extra`.
