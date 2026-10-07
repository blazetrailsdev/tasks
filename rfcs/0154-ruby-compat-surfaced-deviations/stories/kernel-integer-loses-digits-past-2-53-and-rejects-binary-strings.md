---
title: "kernelInteger answers an inexact number for a String past 2^53, and rejects a Uint8Array"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Integer("1" + "0" * 150)` answers the exact Bignum
(`rb_str_convert_to_inum`, `vendor/ruby/v3.3.11/bignum.c:4246`). ruby-compat's
`kernelInteger` (`packages/ruby-compat/src/kernel-integer.ts`) answers a JS
`number` for the same String: `kernelInteger((10n ** 150n).toString())` is
`1e+150`, so every digit past 2^53 is lost silently. It also raises
`TypeError: can't convert String into Integer` for a `Uint8Array`, the binary
String seat (`rbToInteger`, `kernel-integer.ts:124`), where Ruby parses a
binary String as it parses any other.

Found porting `vendor/msgpack/v1.8.0/spec/factory_spec.rb:355-359` ("invokes
the packer if registered with `oversized_integer_extension: true`"), whose
unpacker is `method(:Integer)`. `packages/msgpack/src/factory.test.ts` stands
in with `BigInt(new TextDecoder().decode(data))`.

## Acceptance criteria

- `kernelInteger` answers a `bigint` for a String whose value is not a safe
  integer (through `rbBigNorm`, as the numeric operators in
  `packages/ruby-compat/src/numeric.ts` do), with a test that fails on the
  baseline.
- `kernelInteger` parses a `Uint8Array` as the binary String it is.
- `packages/msgpack/src/factory.test.ts`'s "registering an ext type for
  Integer" tests pass `kernelInteger` as the unpacker, as the gem spec passes
  `method(:Integer)`.
