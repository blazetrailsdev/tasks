---
title: "msgpack parity: floats, negative zero, and the integral-float boxing rule"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
cluster: native
packages: ["msgpack"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

This is the one ambiguity msgpack shares with Marshal: a JS `number` that is
whole-valued is an Integer in trails (`packer.ts:126`), so a Ruby `Float` such
as `1.0` round-trips as a Float only when boxed through `rbDbl2num` — which is
why `build.ts` builds a Ruby `Float` as a boxed `Number`
(`msgpack-parity-value-spec-and-builders`), and why `packer.ts:157` tests
`obj instanceof Number`.

That makes integral floats the highest-risk float cases, not the exotic ones:
the gem writes `1.0` as a float64 and trails must not write it as a fixint.
RFC 0184's `messagepack-duration-integral-float-value-dumps-as-integer` is the
same hazard surfacing inside an ext type.

`-0.0`, NaN and the infinities are the other three, each with a specific bit
pattern the gem emits.

## Acceptance criteria

- [ ] Integral floats generated across the integer width boundaries — `0.0`,
      `1.0`, `127.0`, `256.0`, `2.0**53`, negatives — each asserted to pack as
      a float, matching the gem byte for byte.
- [ ] `-0.0` packs distinguishably from `0.0`.
- [ ] NaN, `Float::INFINITY` and `-Float::INFINITY` match the gem's bit
      patterns.
- [ ] Subnormals, `Float::MAX`, `Float::MIN` and `Float::EPSILON` covered.
- [ ] A float that is also a safe integer is generated as BOTH an int spec and
      a float spec in the same run, asserting the two produce different bytes.
- [ ] `writeFloat32` (`packer.ts:288-295`) is covered by a corpus case but not
      generated, per the RFC's Open Question 3.

## Definition of done

Treating an integral-float divergence as a generator bug does not close this
story; the boxing rule belongs in `build.ts` and the bytes must match the gem.

## Verification

```bash
pnpm fuzz:msgpack --seed 1 --iterations 50000 --only float
```
