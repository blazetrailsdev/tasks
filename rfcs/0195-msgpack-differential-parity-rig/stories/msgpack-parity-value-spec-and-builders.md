---
title: "msgpack parity: the value-spec language and its TS builder"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: rig
packages: ["msgpack"]
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The parity rig cannot hand a value from Ruby to TypeScript; it can only hand
over a recipe for building one. This story lands that recipe format — the
**value-spec** — plus the TypeScript builder that interprets it. The Ruby
builder is `msgpack-parity-ruby-oracle-harness`.

See the RFC section "The value-spec language is the load-bearing piece". A
value-spec is a JSON tree naming a Ruby type and its construction arguments:

```json
{
  "t": "array",
  "v": [
    { "t": "int", "v": "-9223372036854775808" },
    { "t": "float", "v": "-0.0" },
    { "t": "str", "enc": "ASCII-8BIT", "bytes": "FF00" }
  ]
}
```

Two invariants are the whole point of the format, and both are easy to lose:

- **No JSON numbers anywhere.** Every scalar is a decimal string or hex. A
  JSON-number transport loses `-0.0`, integers past 2^53 and float precision —
  the exact distinctions the rig exists to test — and would make the harness
  silently agree with itself.
- **The spec names the RUBY type.** `{"t":"float","v":"1.0"}` is a Ruby
  `Float`, so the TS builder must construct a boxed `Number` (`rbDbl2num`):
  `packer.ts:126` routes an unboxed whole-valued JS number to the integer
  family. Encoding that convention here, once, is what keeps it out of every
  future triage.

This story covers the 9 native type families only (nil, bool, int, float, str,
bin, array, map, ext). The ext-registry classes are added by their own stories
in Phase 3, each extending the spec union.

## Acceptance criteria

- [ ] `packages/msgpack/parity/value-spec.ts` declares the spec union as a
      discriminated union on `t`, covering nil, bool, int, float, str, bin,
      array, map and raw ext.
- [ ] `str` carries an `enc` field and a hex `bytes` field, so a non-UTF-8 and
      an invalid-UTF-8 string are both expressible.
- [ ] `packages/msgpack/parity/build.ts` turns a spec into a TS value, building
      a Ruby `Float` as a boxed `Number` and a Ruby `Integer` past the safe
      range as a `BigInt`.
- [ ] A `canonicalize` function renders a built value as a stable string for
      comparison against the oracle's description.
- [ ] No JSON number appears anywhere in a serialized spec; a unit test asserts
      a round-tripped spec is byte-identical through `JSON.parse`/`stringify`.
- [ ] Unit tests for `build.ts` covering each family, including `-0.0` building
      to a value distinguishable from `0.0`.

## Definition of done

A spec format that carries scalars as JSON numbers does not close this story.

## Verification

```bash
pnpm vitest run packages/msgpack/parity/value-spec.test.ts packages/msgpack/parity/build.test.ts
```

## Notes

`packer.ts:110` (`Number.isSafeInteger`), `:126` (integral-number arm) and
`:157` (`obj instanceof Number`) are the three places the boxing convention is
observable.
