---
title: "cache-serializer-with-fallback-port"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3676
claim: "2026-06-19T21:34:12Z"
assignee: "cache-serializer-with-fallback-port"
blocked-by: null
---

## Context

Split out of `cache-coder-full-surface-serializer-fallback` (RFC 0023): that
story's PR shipped only the `Cache::Coder` surface (`coder.ts` — `Coder` class,
signature/version framing, `LazyEntry`, string fast path, `dumpCompressed`) to
stay under the 500-LOC ceiling. This story ports the second half,
`Cache::SerializerWithFallback`.

Rails source: `vendor/rails/activesupport/lib/active_support/cache/serializer_with_fallback.rb`.
Rails test: `vendor/rails/activesupport/test/cache/serializer_with_fallback_test.rb`
(class `CacheSerializerWithFallbackTest`).

`packages/activesupport/src/cache/serializer-with-fallback.test.ts` is currently
all `it.skip` with the Rails-verbatim names.

Design already validated (a working draft existed; re-derive from these notes):

- A module `SerializerWithFallback` exposing `SERIALIZERS` (keys `passthrough`,
  `marshal_7_0`, `marshal_7_1`, `message_pack`) and a `get(format)` that throws
  a ported `KeyError` on an unknown key (Ruby `fetch`).
- All four serializers share one `load(dumped)` that dispatches by payload
  prefix: `message_pack` signature (`0xcc 0x80`), then `marshal_7_1` signature
  (`\x04\x08`), then `marshal_7_0` mark byte (`\x00`/`\x01`); a non-string that
  is a `Cache::Entry` goes to `passthrough`; anything else logs "Unrecognized
  payload...; deserializing as nil" via `Cache::Store.logger` and returns null.
- trails has no Ruby Marshal wire, so the two marshal formats are backed by the
  fidelity `coder` (`coder.ts`) but keep Rails' distinct framing so cross-format
  dispatch still works. `marshal_7_0` is legacy: `dump`/`dumpCompressed` operate
  on a packed `Entry` (`entry.pack()` / `Entry.unpack`); `marshal_7_1` and
  `message_pack` operate on bare values.
- `message_pack` delegates to `MessagePackCacheSerializer` (`../message-pack`);
  it returns a Buffer, carried on the shared string channel as latin1
  (`buf.toString("latin1")` / `Buffer.from(s, "latin1")`). A missing class on
  load yields undefined (cache miss) — `CacheSerializer` already swallows it.

Supporting changes this story also needs:

- A `Cache::Store.logger` holder in `cache/index.ts` (Rails exposes a
  class-level logger; trails has no `Store` base class yet) plus a `CacheLogger`
  interface.
- `Entry#bytesize` fidelity fix: a compressed entry should report its stored
  (deflated latin1) byte size as the payload string length rather than
  re-dumping the binary string through the JSON `Coder` (which escapes binary
  bytes and over-reports), so the `passthrough` "can compress entries" test
  holds. Rails reaches the same number via `Marshal.dump` of the String.

Hard rules (inherited): no `node:*` imports, no `process.*`, async fs only, no
new runtime deps, camelCase, test names match Rails verbatim, single PR from
main.

## Acceptance criteria

- Implement `SerializerWithFallback` (all four formats plus the shared
  prefix-dispatch `load`) in
  `packages/activesupport/src/cache/serializer-with-fallback.ts`.
- Un-skip `serializer-with-fallback.test.ts`, porting
  `CacheSerializerWithFallbackTest` verbatim (dynamic format-pair names
  included).
- Add the `Cache::Store.logger` holder and the `Entry#bytesize` compressed fix
  needed by the port.
