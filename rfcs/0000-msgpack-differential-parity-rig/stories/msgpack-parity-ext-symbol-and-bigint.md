---
title: "msgpack parity: ext types 0 and 1, Symbol and oversized Integer"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
cluster: ext
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of Phase 3, the ext-registry sweep over the 19 type ids
`packages/activesupport/src/message-pack/extensions.ts:96-196` registers. Each
ext story extends the value-spec union with its classes, adds a Ruby builder
arm in `oracle.rb`, generates against the gem with
`ActiveSupport::MessagePack`'s factory installed, and commits corpus cases.

Type 0 registers `rbCSymbol` with `optimizedSymbolsParsing: true`, so the gem
has a fast path this exercises. A Ruby Symbol is a JS string in trails, with
the leading colon kept only where control flow needs it (root CLAUDE.md), so
the spec must distinguish a Symbol from a String explicitly.

Type 1 registers `rbCInteger` with `oversizedIntegerExtension: true`, routing
an integer past the 64-bit range through `MessagePack::Bigint`. This overlaps
`msgpack-parity-integer-family-boundaries` at the boundary and is the
authoritative place for the beyond-64-bit cases.

## Acceptance criteria

- [ ] Symbols covered: empty, ASCII, multibyte, a symbol needing quoting, one
      colliding with a String of the same characters (asserting different
      bytes), and a long symbol crossing the str width boundaries.
- [ ] `optimizedSymbolsParsing` exercised by packing the same symbol many times
      in one payload, asserting bytes match the gem.
- [ ] Oversized integers either side of 2^64 and -2^63 in both directions,
      through the type 1 path.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
