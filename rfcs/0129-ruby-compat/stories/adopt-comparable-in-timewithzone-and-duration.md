---
title: "TimeWithZone and Duration::Scalar adopt the shared Comparable instead of hand-rolling compar.c"
status: done
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 32
pr: 7321
claim: "2026-09-01T00:46:36Z"
assignee: "retire-no-js-call-form-entries-and-fetch-receipts"
blocked-by: null
closed-reason: null
---

## Context

RFC 0129's `ruby-compat-comparable` (PR #7266) put one `Comparable` in
`packages/ruby-compat/src/comparable.ts` — `cmp` (the `<=>` send),
`cmpint`, `lessThan`, `lessThanOrEqual`, `greaterThan`, `greaterThanOrEqual`,
`equals` and `isBetween`, each ported from `vendor/ruby/compar.c` — and wired
`Date::Infinity` (`packages/date/src/date.ts:5525-5560`) to it as the first
adopter, deleting its private `#cmpint`.

Two hand-rolled sets of the same operators are still in the tree, and both
diverge from `compar.c` in the same way: **they do not raise**.

- `packages/activesupport/src/time-with-zone.ts:941-1036` — `compareTo` returns
  `number` (not `number | null`), and `equals` (`:960`), `isBetween` (`:993`),
  `lessThan` (`:1031`) and `greaterThan` (`:1036`) each read it directly.
  Rails' `ActiveSupport::TimeWithZone` includes `Comparable`
  (`activesupport/lib/active_support/time_with_zone.rb:52`), so `<`, `<=`, `>`,
  `>=` and `between?` all go through `Comparable#cmp_int`
  (`vendor/ruby/compar.c:91`) and raise `ArgumentError` for an operand `<=>`
  cannot place. trails answers `false` instead.
- `packages/activesupport/src/duration.ts:867-891` — `Scalar#compareTo` returns
  `NaN` for an incomparable receiver where Ruby's `<=>` returns **nil**
  (`activesupport/lib/active_support/duration.rb:31-38`), and `equals`
  (`:885-891`) is a hand-written `compareTo(other) === 0`. `Scalar < Numeric`
  includes `Comparable`, so that `==` IS `cmp_equal`
  (`vendor/ruby/compar.c:79`) — including its `if (x == y) return Qtrue`
  identity shortcut, which the hand-rolled copy does not have (the same gap
  #7266 fixed on `Date::Infinity`).

`Duration` itself (`duration.rb:341-347`) reaches `Scalar#==` through
`other == value`, so the `==` arm is load-bearing.

## Acceptance criteria

- `TimeWithZone` and `Duration::Scalar` adopt `comparable.ts`'s exports the way
  `Date::Infinity` does — the `this`-typed functions assigned to the class,
  plus `[rubyClass]` where the Ruby class name is not the TS
  `constructor.name`. No second copy of any `compar.c` body survives.
- `compareTo` on both returns `number | null`, MRI's nullable `<=>`; the `NaN`
  sentinel in `duration.ts:867` goes away with it.
- `<`, `<=`, `>`, `>=` and `between?` raise `ArgumentError` with
  `rb_cmperr`'s message (`comparison of ActiveSupport::TimeWithZone with X
failed`) for an operand `<=>` cannot place, and `==` answers `false` without
  raising — the `compar.c:79` vs `:91` split.
- Every existing call site that relied on the non-raising `false` is updated or
  shown not to reach the raising arm; the activesupport suite stays green.
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra` show no
  new rows.
