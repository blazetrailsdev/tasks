---
title: "StringInquirer/ArrayInquirer Proxy resolves every method name, not just Rails' ?-suffixed ones"
status: done
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6649
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`StringInquirer` and `ArrayInquirer` are ported as a `Proxy` whose `get` trap
returns a predicate closure for **every** unknown property name
(`packages/activesupport/src/string-inquirer.ts:16-27`,
`packages/activesupport/src/array-inquirer.ts:14-36`). Rails narrows both to
names ending in `?`:

- `vendor/rails/activesupport/lib/active_support/string_inquirer.rb:23-31` —
  `respond_to_missing?` is `method_name.end_with?("?") || super`, and
  `method_missing` compares `self == method_name[0..-2]` only when the name ends
  in `?`, else `super` (so a bare `production` raises `NoMethodError`).
- `vendor/rails/activesupport/lib/active_support/array_inquirer.rb:38-46` — the
  same pair over `include?`.

Two consequences, both observable:

1. `assert_not_respond_to arr, :nope` / `assert_not_respond_to str, :nope`
   (`array_inquirer_test.rb:56`, `string_inquirer_test.rb:36`) cannot fail: our
   Proxy answers every name, so the port has no way to express the negative arm.
2. `test_missing_question_mark` (`string_inquirer_test.rb:19-21`) asserts
   `NoMethodError` for `@string_inquirer.production`; our Proxy hands back a
   callable, so nothing raises.

The port also invents an `isX` → `x` rewrite and a bare-name arm
(`string-inquirer.ts:23-24`) that Rails has no counterpart for.

## Converged shape

`get` resolves only what Rails resolves: an own/inherited property, or a
`?`-suffixed predicate name. Anything else returns `undefined`, so calling it
throws — the JS analogue of `NoMethodError` reaching `super`. Callers then spell
the predicate the way Ruby does, `env["production?"]()`. Audit and update the
existing call sites first — `delegated-type.ts:136` returns an inquirer, and
`Trails.env` is an `EnvironmentInquirer` (`trailties/src/rails.ts:90`), whose
`isLocal()` / `"local?"()` pair already shows the intended spelling
(`environment-inquirer.ts`). Drop the `isX` rewrite unless a call site proves it
load-bearing, and if it is, keep the Rails name alongside rather than instead.

## Acceptance criteria

- `string_inquirer_test.rb` and `array_inquirer_test.rb` report 0
  assertion-count / 0 kind / 0 value in
  `pnpm parity:test -- --assertions --package activesupport`, including the
  `assert_not_respond_to` and `NoMethodError` arms.
- No existing caller regresses; `pnpm parity:api:extra --package activesupport`
  gains no novel surface.
