---
title: "MessagePack::Bigint and Symbol ext helpers, and oversized_integer_extension (fixes silent BigInt truncation)"
status: in-progress
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
cluster: null
packages: ["msgpack"]
deps: ["msgpack-package-and-vendor-source"]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8647
claim: "2026-10-07T17:35:45Z"
assignee: "msgpack-bigint-ext-and-oversized-integer"
blocked-by: null
closed-reason: null
---

## Context

`Extensions.install` registers ext type 1 with the gem's oversized-integer hook
(`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/extensions.rb:26-29`):

    registry.register_type 1, Integer,
      packer: ::MessagePack::Bigint.method(:to_msgpack_ext),
      unpacker: ::MessagePack::Bigint.method(:from_msgpack_ext),
      oversized_integer_extension: true

`MessagePack::Bigint` is gem code (`lib/msgpack/bigint.rb`) that no JS msgpack
library ships, and `oversized_integer_extension:` is a hook neither
`@msgpack/msgpack` nor `msgpackr` exposes — an `ExtensionCodec` is consulted for
objects, never for a `bigint` primitive.

On `@msgpack/msgpack` 3.1.3 an out-of-int64 BigInt is SILENTLY TRUNCATED rather
than refused:

    encode(2n ** 70n, { useBigInt64: true })  // => cf0000000000000000
    decode(...)                               // => 0n

So the ext-1 path has to intercept before the native integer path. (`msgpackr`
throws on the same input, which is why this is a property of the chosen engine,
not of msgpack.)

Ext type 0 has the sibling problem: it names `:to_msgpack_ext` /
`:from_msgpack_ext` (`extensions.rb:20-24`), which are `lib/msgpack/symbol.rb`,
also gem code.

## Acceptance criteria

- `packages/msgpack/src/bigint.ts` mirrors `lib/msgpack/bigint.rb`:
  `MessagePack::Bigint.toMsgpackExt` / `.fromMsgpackExt`, byte-compatible with the
  gem's encoding (sign byte plus 32-bit words — read the vendored source, do not
  infer).
- `packages/msgpack/src/symbol.ts` mirrors `lib/msgpack/symbol.rb`'s
  `to_msgpack_ext` / `from_msgpack_ext`.
- `Factory#registerType` accepts `oversizedIntegerExtension`, and `Packer#write`
  routes a `bigint` outside int64 through that type's packer instead of the
  engine's integer path.
- A regression test FAILS ON THE BASELINE: `2n ** 70n` round-trips, where today
  it encodes `cf0000000000000000` and decodes `0n`. Assert the bytes, not only the
  round-trip, so a future engine swap cannot quietly change the wire format.
- Within-range values are unaffected: a positive 2^62 still writes `cf`, as Ruby
  does, not `d3`.
- `pnpm vitest run packages/msgpack` green.
