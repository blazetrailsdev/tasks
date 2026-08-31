---
title: "port-time-to-f-compare-and-eql-onto-date-package-time"
status: ready
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`time-coercion-operator-methods-onto-time-class` (RFC 0113) is blocked on this:
the `*_with_coercion` halves in
`vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:317-346`
each delegate to a Ruby CORE `Time` method that `@blazetrails/date` has not
ported.

`packages/date/src/time.ts` defines `isDst`, `toI`, `toTime`, `toDate`,
`toDatetime`, `strftime`, `isUtc`, `plus`, `minus`, `getutc`, `getlocal`,
`toS`, `asctime`, `xmlschema`, `httpdate`, `actsLikeTime` — and nothing else.
So:

- `minus_with_coercion` (`:317-320`) needs `to_f` for its `DateTime` arm
  (`to_f - other.to_f`). `Time#to_f` (`ruby/time.c` `time_to_f`) is unported;
  the only trails `toF` over a time value is
  `core-ext/date-time/conversions.ts:143`, which takes a `DateTime`.
- `compare_with_coercion` (`:324-338`) calls `compare_without_coercion` three
  times — Ruby's core `Time#<=>` (`time.c` `time_cmp`). Unported.
- `eql_with_coercion` (`:342-346`) calls `eql_without_coercion` — core
  `Time#eql?` (`time.c` `time_eql`). Unported.

`minus_without_coercion` is the one half that DOES have a counterpart:
`Time#minus` (`packages/date/src/time.ts:1205`).

## Acceptance criteria

- `Time#toF`, `Time#compare` (Ruby `<=>`) and `Time#eql` (Ruby `eql?`) are
  ported in `packages/date/src/time.ts` at the MRI semantics —
  `time_to_f`/`time_cmp`/`time_eql` in `ruby/time.c` — with `compare` answering
  `-1/0/1` (and nil-equivalent for an incomparable operand, as `time_cmp` does)
  and `eql` requiring the same class AND the same nanosecond value, which is
  what makes it stricter than `==`.
- `pnpm parity:api` date-package figures do not regress; `parity:api:calls` and
  `parity:api:extra` green.
- Once landed, `time-coercion-operator-methods-onto-time-class` can be
  unblocked for the three `*_with_coercion` methods. Its two `*_with_duration`
  halves stay blocked on a SEPARATE prerequisite, recorded in that story's
  block reason: `Duration#since`/`#until` bottom out in
  `applyDurationPreservingNs` (`packages/activesupport/src/duration.ts:727-735`),
  which accepts only `Date`/`Temporal.Instant`/`Temporal.PlainDate` and raises
  `ArgumentError` for a `::Time` receiver, so `other.since(self)`
  (`time/calculations.rb:298`) cannot run.
