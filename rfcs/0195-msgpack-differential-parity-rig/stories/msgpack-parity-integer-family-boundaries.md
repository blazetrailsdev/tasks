---
title: "msgpack parity: the integer family and the safe-integer seam"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: native
packages: ["msgpack"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

msgpack encodes an integer in one of ten widths — positive fixint, negative
fixint, uint8/16/32/64, int8/16/32/64 — and the gem picks the narrowest that
fits. A port that picks a wider one produces bytes that decode to the same
value, so no round-trip test catches it; only a byte comparison does.

trails has a seam the gem does not: `Number.isSafeInteger` gates the fast path
at `packer.ts:110`, the integral arm at `:126`, `writeInt` at `:214` and a
further check at `:415`. Past 2^53 a value must arrive as a `BigInt`, and type
1's `oversizedIntegerExtension` takes over beyond the 64-bit range.

## Acceptance criteria

- [ ] Generator coverage of every width transition in both signs: 0, 127, 128,
      255, 256, 65535, 65536, 2^32-1, 2^32, 2^63-1, 2^64-1, and -1, -32, -33,
      -128, -129, -32768, -32769, -2^31, -2^63.
- [ ] Coverage either side of 2^53 in both signs, generated as both `number`
      and `BigInt` specs where both are representable, asserting the same bytes.
- [ ] A value past the 64-bit range packs through type 1 and matches the gem.
- [ ] Corpus cases committed for each width transition.
- [ ] Any divergence is filed as its own story with the byte diff attached.

## Verification

```bash
pnpm fuzz:msgpack --seed 1 --iterations 50000 --only int
```
