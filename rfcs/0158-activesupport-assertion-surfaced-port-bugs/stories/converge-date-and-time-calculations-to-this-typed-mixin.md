---
title: "converge-date-and-time-calculations-to-this-typed-mixin"
status: done
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8062
claim: "2026-09-24T22:11:22Z"
assignee: "converge-date-and-time-calculations-to-this-typed-mixin"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/core-ext/date-and-time/calculations.ts` ports
`DateAndTime::Calculations`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`)
as free functions taking the receiver as argument 1 (`dateOrTime`), where Ruby's
module methods call on implicit `self`. The story that created the file
(`date-and-time-calculations-predicates-and-day-arithmetic`, trails#6452) called
for "this-typed functions / include()" and shipped the free-function shape
instead.

The cost is a standing block of `kind: "args"` rows in
`scripts/api-compare/call-mismatches-exclude/activesupport/core-ext/date-and-time/calculations.json`,
each with the same reason: "the port is a free function taking the receiver as
argument 1". Thirteen were already there; trails#7827 added seven more
(`days_since`, `months_since`, `next_occurring`, `tomorrow`, `weeks_since`,
`years_since`, `yesterday`, all on the `advance` call) — not new deviation, but
the same one becoming visible once `advance` resolved as a call, because that PR
mixed the module into `Time` (`core_ext/time/calculations.rb:13`) and gave the
private `advance` a `RubyTime` arm that dispatches to the receiver's own
`advance`.

Converging the module to `this`-typed functions + `include()` (the settled trails
idiom, CLAUDE.md "Module mixins") retires all twenty rows at once and is what
makes the `Time` / `Date` / `DateTime` mixins read like Rails' `include`.

## Acceptance criteria

- `DateAndTime::Calculations` members are `this`-typed and mixed into `Date`,
  `Time` and `DateTime` via `include()` / `Included<>`, with the receiver no
  longer a leading parameter.
- Every `kind: "args"` row in that baseline shard whose reason is the
  receiver-as-argument-1 class is deleted (twenty rows as of trails#7827), and
  `pnpm parity:api:calls:args` is clean without them.
- The ad-hoc `Object.defineProperty` mixin loop at the bottom of
  `core-ext/time/calculations.ts` is replaced by `include()`.
- `pnpm parity:api` and `pnpm parity:test` deltas are non-negative.
