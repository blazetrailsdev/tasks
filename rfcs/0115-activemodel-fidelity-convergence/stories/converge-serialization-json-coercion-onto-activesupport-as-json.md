---
title: "Converge serialization's JSON coercion onto ActiveSupport's Object#as_json"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel", "activesupport"]
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: "2026-08-20T19:35:09Z"
assignee: "converge-model-name-constructor-and-comparable-surface"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/serialization.ts:608` `coerceForJson` and `:618`
`_coerceForJson` are 63 code lines of recursive JSON coercion with cycle
detection (`WeakMap` memo + `WeakSet` in-progress set), plus the supporting
`safeSet` (`:557`, prototype-pollution guard) and `rubyArray` (`:719`).

Rails does none of this in `serialization.rb`. `as_json` dispatches to
`ActiveSupport`'s `Object#as_json` family in
`activesupport/lib/active_support/core_ext/object/json.rb`, and trails
**already ports it**:
`packages/activesupport/src/core-ext/object/json.ts` carries the full
per-class dispatch — `Object.asJson` (`:76`), `Hash.asJson`, `Array.asJson`
(`:163`), `Numeric`/`Integer`/`Float` (`:107`, `:117`), `BigDecimal` (`:130`),
`Regexp` (`:137`), `Enumerable` (`:147`), `Range` (`:156`), `String` (`:100`),
`TrueClass`/`FalseClass` (`:86`), `NilClass` (`:93`), and a free `asJson()`
standing in for Ruby's method lookup (`json.ts:17`).

Two spellings of the same Rails construct — the RFC 0112 pattern.

## Acceptance criteria

- `coerceForJson` / `_coerceForJson` are deleted; `serialization.ts` and
  `serializers/json.ts` call `asJson()` from `@blazetrails/activesupport`.
- Any coercion case the activemodel copy handled and the activesupport port
  does not (`undefined`-vs-`null`, cycles) is added to the activesupport port
  at the Rails-named class it belongs to, with a test there.
- `safeSet` survives only if a prototype-pollution guard is genuinely required
  at a site Rails also writes into a hash; otherwise it goes.
- `pnpm parity:api:extra --package activemodel` loses the `coerceForJson` row;
  `serialization.ts` novel count drops.
- Parity deltas non-negative for activemodel **and** activesupport;
  `pnpm parity:api:calls` / `:args` clean, no reseed;
  `activemodel/serializers/json.json`'s single row shrinks or holds.

## Verification

```bash
pnpm vitest run packages/activemodel/src/serialization.test.ts packages/activemodel/src/serializers packages/activesupport/src/core-ext/object/json-gem-encoding.test.ts
```
