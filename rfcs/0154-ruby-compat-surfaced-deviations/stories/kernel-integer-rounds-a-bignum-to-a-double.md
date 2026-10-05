---
title: "kernelInteger rounds a Bignum to a double"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`kernelInteger` (`packages/ruby-compat/src/kernel-integer.ts:34`, MRI
`rb_convert_to_integer`, `vendor/ruby/v3.3.11/object.c:3257`) is typed
`number` and narrows a parsed bignum with `Number(...)`, although the parser
beneath it, `rbIntParseCstr` (`packages/ruby-compat/src/string/convert.ts:25`),
answers `number | bigint`. Ruby's `Integer("0x123456789abcdef")` is the exact
Bignum 81985529216486895; trails answers the rounded double.

Surfaced by `Psych::ScalarScanner#parse_int`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/scalar_scanner.rb:109-111`,
`Integer(string.delete(',_'))`), ported in trails#8511. Its test
`test_scan_int_commas_and_underscores`
(`vendor/ruby/v3.3.11/test/psych/test_scalar_scanner.rb:139-142`) asserts
`0x123456789abcdef`; the port in
`packages/ruby-compat/src/psych/scalar-scanner.trails.test.ts` asserts
`Number(0x123456789abcdefn)` instead.

## Acceptance criteria

- [ ] `kernelInteger` answers a `bigint` for a value outside the safe-integer
      range, as `rbIntParseCstr` and `rbStrToI` already do, and its callers are
      audited for the widened return type.
- [ ] The six `Number(0x123456789abcdefn)` assertions in
      `scalar-scanner.trails.test.ts` assert the exact `0x123456789abcdefn`.
