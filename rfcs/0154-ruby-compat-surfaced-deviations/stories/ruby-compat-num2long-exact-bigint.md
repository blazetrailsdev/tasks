---
title: "ruby-compat: num2long keeps an in-range bigint exact"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rb_num2long` (`vendor/ruby/v3.3.11/numeric.c:3135-3160`) returns a C `long`, and `rb_big2long`
(`bignum.c:5170`) converts any Bignum inside `LONG_MIN..LONG_MAX` exactly.

ruby-compat's `num2long` (`packages/ruby-compat/src/string/support.ts`, trails#8297) returns a JS
`number`. An in-range `bigint` above `Number.MAX_SAFE_INTEGER` is therefore rounded:
`2n ** 63n - 1n` becomes `2 ** 63`, a value Ruby would reject as out of range.

## Acceptance criteria

- [ ] `num2long` keeps the exact signed-long value for every in-range `bigint`. That means
      returning `bigint` past 2^53, or raising at the one call site that needs a safe integer, as
      Ruby's `long`-to-index conversions do. Audit every caller: string/byte-methods, convert, sub,
      method-table, match-data and process-adapter's `gets`.
- [ ] A test covers `2n ** 63n - 1n` and `-(2n ** 63n)`.
