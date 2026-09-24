---
title: "Core-class asJson ports drop Rails' as_json(options = nil) parameter"
status: done
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8041
claim: "2026-09-24T16:43:54Z"
assignee: "gate-or-retire-the-branch-name-story-fallback"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/core-ext/object/json.ts` ports each core class's `as_json`, and most of them drop the `options` parameter. Rails declares `def as_json(options = nil)` on every one: `TrueClass` / `FalseClass` / `NilClass` / `String` / `Symbol` / `Numeric` / `Float` / `BigDecimal` / `Regexp` / `Range` / `Time` / `Date` / `DateTime` … (`activesupport/lib/active_support/core_ext/object/json.rb:80-257`). trails' `TrueClass.asJson(value)`, `NilClass.asJson(_value)`, `Numeric.asJson(value)`, `Float.asJson(value)` and similar take only the value. trails#8005 added `options` to `String.asJson` alone, so that `Multibyte::Chars#as_json` could pass it through as Rails does (`multibyte/chars.rb:164-165`).

The converged shape: each static `asJson(value, options: EncodeOptions | null = null)` declares Rails' `options` parameter. Callers that forward options (`Array.asJson`, `Hash.asJson`, the `asJson` dispatcher at `json.ts:256`) pass it uniformly instead of branching on `options ? asJson(v, options) : asJson(v)`.

## Acceptance criteria

- [ ] Every ported core-class `asJson` declares `options` as Rails does.
- [ ] The dispatcher and the `Array` / `Hash` recursion pass `options` unconditionally, matching `json.rb:164-195`.
- [ ] `pnpm parity:api:params` and `pnpm parity:api:calls:args` are green.
