---
title: "Option.parse and validate_default_type!'s when Numeric omit Rational, Complex and BigDecimal"
status: in-progress
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#8554
claim: "2026-10-05T19:39:33Z"
assignee: "port-render-test-expires-in-and-last-modified"
blocked-by: null
closed-reason: null
---

## Context

`Thor::Option.parse` infers a type with `when Numeric` then `:numeric`
(`vendor/thor/v1.3.2/lib/thor/parser/option.rb:63-64`), and
`Thor::Option#validate_default_type!` does the same for `@default`
(`option.rb:137-138`). `packages/trailties/src/thor/parser/option.ts:75` and
`:164` (merged in trails PR 8388) port both arms as
`typeof x === "number" || typeof x === "bigint"`, which is Integer and Float
only. Ruby's `Numeric` also covers `Rational`, `Complex` and `BigDecimal`,
all of which ruby-compat ports. So `Option.parse("foo", rational(1, 3))` has
type `nil` (and falls back to `:string`) where Thor gives `:numeric`, and a
`BigDecimal` default on a `:numeric` option reads as default type `""` and
raises or warns where Thor accepts it.

This is the same gap as
`thor-arguments-parse-numeric-is-a-numeric-omits-rational-complex-bigdecimal`,
which adds the ruby-compat `Numeric` kind-of test. This story is the two
`Option` call sites.

## Acceptance criteria

- [ ] `Option.parse` and `Option#validateDefaultTypeBang` call the ruby-compat
      `Numeric` kind-of test that story adds, in place of the inline
      `number` / `bigint` check.
- [ ] `option.trails.test.ts` covers a `Rational` and a `BigDecimal` value in
      both arms: `parse` yields `"numeric"`, and a `:numeric` option with
      `checkDefaultType: true` accepts the default.
