---
title: "time-plus-duration-is-typed"
status: draft
updated: 2026-10-20
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

ActiveSupport reopens Ruby's `Time`, replacing `+` and `-` so a `Duration` advances the time: `plus_with_duration` / `minus_with_duration`, aliased over `+` / `-` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/calculations.rb:297-315`).

trails installs the same behaviour at run time: `packages/activesupport/src/core-ext/time/calculations.ts:277-290` replaces `RubyTime.prototype.plus` / `minus` with `plusWithDuration` / `minusWithDuration`. The type of `Time` is left as `@blazetrails/date` declares it, `plus(offset: number | bigint | Rational | Time): Time` (`packages/date/src/time.ts:1582`), so `Time.now().plus(Duration.seconds(3))` works but does not type-check.

The generated activejob tests (codegen-native-inference) report 24 TS2345 errors on exactly this call (`exceptions_test.rb`'s `Time.now + 3.seconds`). Hand code that adds a Duration to a Time has to cast.

## Acceptance criteria

- activesupport declares what it installs, as TypeScript's form of reopening a class: a module augmentation of `@blazetrails/date`'s `Time` in `core-ext/time/calculations.ts`, overloading `plus(other: Duration): Time` and `minus(other: Duration): Time`. The run time is unchanged.
- `Time.now().plus(Duration.seconds(3))` and `.minus(…)` type-check wherever activesupport is imported, with no cast.
- A trails test covers both overloads and asserts the resulting time.
- Date's `+` / `-` with a Duration (`core-ext/date/calculations.ts`, `plusWithDuration`) gets the same treatment if its type has the same gap.
