---
title: "Converge Time.at's declared parameter onto MRI's VALUE so coerced callers drop the cast"
status: in-progress
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 29
pr: 7519
claim: "2026-09-05T14:02:10Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

MRI's `time_s_at` takes a `VALUE` and rejects a non-Numeric inside `num_exact`
(`ruby/time.c`), so `Time.at` accepts ANY object at the signature and raises
`TypeError, "can't convert X into an exact number"` at conversion time.

`packages/date/src/time.ts:671-674` declares the narrow

```ts
static at(
  seconds: number | bigint | Rational | Time,
  microsecondsWithFrac?: number | bigint | Rational,
): Time
```

PR #7276 ported `Time.at_with_coercion` (`core_ext/time/calculations.rb:44-60`)
onto `Time` and aliased it over `Time.at`. Ruby's `alias_method` widens what
`Time.at` accepts — a `TimeWithZone` and a `DateTime` are now legal arguments —
but TypeScript cannot widen an existing class static through declaration
merging, so `packages/activesupport/src/core-ext/time/calculations.ts`'s
assignment carries an `as typeof RubyTime.at` cast and EVERY caller handing
`Time.at` a coerced value casts `as never` at the call site. There are 12 such
casts in `packages/activesupport/src/core-ext/time-ext.test.ts` alone (the
ported `at with datetime` / `at with time with zone` families), where Rails
writes a bare `Time.at(dt)`.

That cast was unavoidable when `numExact` fell through to `fToR` for a
non-numeric. PR #7276 also fixed `numExact`
(`packages/date/src/time.ts:244-253`) to raise MRI's `TypeError` for any
non-numeric, which removes the reason the declared type had to stay narrow: the
runtime now rejects exactly what MRI rejects, at the same site.

## Acceptance criteria

- `Time.at`'s first parameter converges to MRI's `VALUE` — `unknown` — with the
  narrowing done in the body, where `num_exact` does it.
- The `as typeof RubyTime.at` cast on the alias assignment in
  `core-ext/time/calculations.ts` is deleted, and the JSDoc paragraph on
  `atWithCoercion` explaining the call-site casts goes with it.
- Every `as never` at a `Time.at` call site is deleted; the ported Rails tests
  read `Time.at(dt)` / `Time.at(twz)` as `time_ext_test.rb:1154-1209` does.
- `pnpm parity:api` delta non-negative; `parity:api:params` green.
