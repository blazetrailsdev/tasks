---
title: "msgpack core_ext to_msgpack, and the gem's Time / timestamp ext type -1"
status: draft
updated: 2026-10-06
rfc: "0184-msgpack-gem-port"
cluster: null
packages: ["msgpack"]
deps: ["msgpack-package-and-vendor-source"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two gem files remain unported after `msgpack-package-and-vendor-source` and
`msgpack-bigint-ext-and-oversized-integer`, and both are reachable from Rails
bodies:

- `lib/msgpack/core_ext.rb` defines `Object#to_msgpack` and the per-class
  `to_msgpack` overrides. `ActiveSupport::MessagePack::Serializer`'s SIGNATURE
  comment names it directly:
  `vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/serializer.rb:8`
  is `SIGNATURE = "\xCC\x80".b.freeze # == 128.to_msgpack`.
- `lib/msgpack/time.rb` and `lib/msgpack/timestamp.rb` define the gem's built-in
  timestamp ext (type -1) and `Time` packing. Rails registers its OWN `Time` at
  ext type 7 (`extensions.rb:55`) rather than using the gem's, so these are the
  gem's surface rather than a Rails dependency — but they are part of the package
  and `messagepack-ext-temporal` reads against them.

## Acceptance criteria

- `packages/msgpack/src/core-ext.ts` mirrors `lib/msgpack/core_ext.rb`:
  `toMsgpack` on the ported classes, dispatching through `Packer`.
- `packages/msgpack/src/time.ts` and `src/timestamp.ts` mirror
  `lib/msgpack/time.rb` and `lib/msgpack/timestamp.rb`, including the ext type -1
  wire formats (4-byte, 8-byte and 12-byte) — read the vendored source for the
  exact layouts.
- A test asserts `rbIntToMsgpack(128)` (or whatever the ported spelling is) is
  `"\xCC\x80"`, which is the identity `serializer.rb:8` asserts in a comment.
- Gem `spec/` tests covering `to_msgpack` and the timestamp ext are ported as
  `*.test.ts`, and `pnpm parity:test` delta is non-negative.
- `pnpm vitest run packages/msgpack` green.
