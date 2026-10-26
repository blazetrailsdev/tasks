---
title: "Time.at num_exact accepts to_r/to_int objects (Duration)"
status: in-progress
updated: 2026-10-26
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9324
claim: "2026-10-26T12:14:35Z"
assignee: "lookup-context-register-detail-accessors-typed-on-merge"
blocked-by: null
closed-reason: null
---

## Context

`numExact` in `packages/date/src/time.ts:179` accepts only `Rational`, `bigint` and `number`, and raises `TypeError` for anything else. MRI's `num_exact_check` (`vendor/ruby/v3.3.11/time.c:518-559`) has a default arm. It calls `to_r` via `rb_check_funcall`, then requires `to_int` availability. Failing that, it falls back to `rb_check_to_int`. So `Time.at(30.seconds)` works in Ruby, because a `Duration` answers `to_r` / `to_int` through its value.

This blocks `date-helper-normalize-distance-admits-duration-as-numeric`: `normalize_distance_of_time_argument_to_time` reaches `Time.at(value)` with a `Duration` (`actionview/lib/action_view/helpers/date_helper.rb:699-707`). Fixing it also needs:

- `Duration#is_a?(Numeric)` (`activesupport/lib/active_support/duration.rb:330-333`) to answer true. trails' `isA` uses `Object(this.value) instanceof klass`, which is false for `rbCNumeric`. It should be `rbObjIsKindOf(this.value, klass)`.
- a `Symbol.hasInstance` hook on `rbCNumeric` for `Duration`, mirroring the `RubyTime` hook in `core-ext/time/calculations.ts:482`.

## Acceptance criteria

- `numExact` ports `num_exact_check`'s default arm: `toR` with a `toInt` check, then `rbCheckToInt`.
- `Time.at(Duration.seconds(30))` answers the epoch plus 30s.
- `Duration#isA(rbCNumeric)` answers true.
