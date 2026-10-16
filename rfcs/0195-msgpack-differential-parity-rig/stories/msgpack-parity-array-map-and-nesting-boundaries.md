---
title: "msgpack parity: array and map headers, key order and nesting depth"
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

Containers have their own header width transitions (`writeArrayHeader`,
`packer.ts:249`; `writeMapHeader`, `:262`), and a map adds an ordering
question: the gem writes a Ruby Hash in insertion order, while a JS object
reorders integer-like keys — `{"2": a, "1": b}` iterates `1, 2`. Any map spec
with numeric-looking keys is therefore a real divergence risk, and the
value-spec must carry map entries as an ordered pair list rather than an
object.

## Acceptance criteria

- [ ] Array header transitions: 0, 15, 16, 65535, 65536 elements.
- [ ] Map header transitions: 0, 15, 16, 65535, 65536 pairs.
- [ ] Map entries are carried as an ordered list of pairs in the value-spec,
      and insertion order is preserved through `build.ts` and asserted against
      the gem — including maps whose keys are numeric strings, integers, and a
      mix.
- [ ] Non-string map keys covered: integers, nil, booleans, arrays, and nested
      maps.
- [ ] Deep nesting to a bounded depth, asserting bytes match and neither side
      stack-overflows; the depth at which either side fails is recorded.
- [ ] Heterogeneous containers mixing every native family.

## Notes

If `build.ts` builds a map as a plain JS object anywhere, numeric key order is
silently lost before the packer ever sees it — the bug would be in the harness,
not the port. An ordered pair list in the spec is what prevents that.
