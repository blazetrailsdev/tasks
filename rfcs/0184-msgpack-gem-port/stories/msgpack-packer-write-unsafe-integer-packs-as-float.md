---
title: "msgpack: Packer#write packs a whole number past 2**53 as float64"
status: draft
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
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

`msgpack_packer_write_value` (`vendor/msgpack/v1.8.0/ext/msgpack/packer.c:150-190`)
writes a `T_FIXNUM` through `msgpack_packer_write_fixnum_value` and a `T_BIGNUM`
through `msgpack_packer_write_bignum_value` (`ext/msgpack/packer.h:465-498`), so
an Integer is always packed as an Integer.

`Packer#write` (`packages/msgpack/src/packer.ts`) sends every JS `number` to the
engine's `encoder.encodeSharedRef(v)`. `@msgpack/msgpack` encodes a whole
`number` past `Number.MAX_SAFE_INTEGER` as float64, so `write(2 ** 60)` packs
`cb...` where the gem packs `cf1000000000000000`. `rbObjClass(2 ** 60)` is
`rbCInteger`, so this is an Integer by ruby-compat's own rule.

trails PR 8650 fixed the same hole in the new `Packer#writeInt`
(`Number.isSafeInteger` gate, else `writeBignumValue(BigInt(obj))`); the
reviewer noted `write` still has it.

## Acceptance criteria

- `Packer#write` routes a whole `number` outside the safe range through
  `writeBignumValue(BigInt(v))`, as `writeInt` does, including the
  `oversized_integer_extension` lookup and the `RangeError` past 64 bits.
- A non-whole `number` and a boxed `Number` still pack as float64.
- A test pins `write(2 ** 60)` to `cf 10 00 00 00 00 00 00 00` and
  `write(-(2 ** 60))` to the `d3` int64 form.
