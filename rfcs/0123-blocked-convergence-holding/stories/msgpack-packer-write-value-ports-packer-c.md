---
title: "msgpack: Packer encodes through a port of packer.c/packer.h, not @msgpack/msgpack's Encoder"
status: draft
updated: 2026-11-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10226 ported the unpacker's read loop (`ext/msgpack/unpacker.c:438-896`) into `packages/msgpack/lib/unpacker.ts`. On 2026-11-16 the operator lifted RFC 0184's "no porting ext/msgpack/\*.c" non-goal for the unpacker only. The packer still encodes through `@msgpack/msgpack`'s `Encoder`: `packages/msgpack/lib/packer.ts:39-40` builds `encoder` / `floatEncoder`, and `write`, `writeFloat`, `writeBin`, `writeExt` and `writeStringValue` hand values to `encodeSharedRef` (`packer.ts:130,150,187,206,236,326,427`). So the integer, float, str, bin and ext encodings are the npm engine's choices, not the gem's.

Rails source:

- `vendor/msgpack/v1.8.0/ext/msgpack/packer.c:52-215`: `msgpack_packer_write_array_value`, `_hash_value`, `_other_value`, `_value`
- `vendor/msgpack/v1.8.0/ext/msgpack/packer.h:77-509`: `write_nil` / `_true` / `_false`, `write_long`, `write_long_long`, `write_u64`, `write_float`, `write_double`, `write_raw_header`, `write_bin_header`, `write_array_header`, `write_map_header`, `write_ext`, `write_string_value`, `write_symbol_value`, `write_fixnum_value`, `write_bignum_value`, `write_float_value`

Blocked on: an operator decision to lift the same non-goal for `packer.c` / `packer.h`, as was done for the unpacker. Record it in `packages/msgpack/CLAUDE.md`.

## Acceptance criteria

- `Packer#write` and every `write*` writer encode through ports of the `packer.h` inline writers above, under their C names, with the same width selection (`write_long`'s fixint / int8 / int16 / int32 / int64 ladder, `write_raw_header`'s compatibility-mode branch, the `write_ext` fixext sizes).
- `@msgpack/msgpack` is removed from `packages/msgpack/package.json`.
- `pnpm parity:test --package msgpack` stays at 347/374 with 0 assertion mismatches, and the activesupport / activerecord message-pack suites stay green.
