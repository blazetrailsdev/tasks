---
title: "Move the cache payload's ASCII-8BIT encode from the serializer call sites into coder"
status: draft
updated: 2026-09-04
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7470 made `File.binread` / `IO.binread` answer ASCII-8BIT bytes
(`vendor/ruby/io.c:12242`), which `ActiveSupport::Cache::FileStore` reads with
(`file_store.rb:124`) what `File.atomic_write` wrote (`:127`). For that pair to
round-trip, the serialized payload has to BE bytes — which it is in Ruby,
because `Marshal.dump`'s buffer is `rb_str_buf_new(0)`
(`vendor/ruby/marshal.c:1241`, ASCII-8BIT) and it sends `binmode` to an IO port
(`marshal.c:1246`).

trails' Marshal stand-in is `coder` (`packages/activesupport/src/cache/coder.ts:102`),
which answers JSON TEXT. #7470 compensated at the call sites instead: two
unexported helpers `toBinary` / `fromBinary` in
`packages/activesupport/src/cache/serializer-with-fallback.ts`, wrapped around
`coder.dump` / `coder.load` at four sites — `marshal70WithFallback.dump`,
`marshal70WithFallback.dumpCompressed`'s uncompressed arm,
`marshal71WithFallback.dump` and `._load`.

Rails' bodies have no such wrapper:
`activesupport/lib/active_support/cache/serializer_with_fallback.rb`'s
`marshal_7_1_with_fallback.dump` is `MARSHAL_SIGNATURE + Marshal.dump(value)`,
full stop. So the port carries an indirection Rails does not have, at four
ported call sites.

## Converged shape

Move the encode into `coder` — `coder.dump` answers a binary String and
`coder.load` takes one — so the four serializer bodies go back to a bare
`coder.dump(value)` / `coder.load(payload)` and `toBinary` / `fromBinary`
disappear. That puts the ASCII-8BIT where Ruby puts it, at the `Marshal`
boundary, rather than at each caller.

## Blocker to clear first

`coder` is not only the cache's Marshal stand-in: `messages/metadata.ts:1` and
`messages/serializer-with-fallback.ts:5` import it too, and the message
verifier base64-encodes what it dumps. Changing `coder`'s encoding therefore
changes the SIGNED MESSAGE WIRE FORMAT — a previously-signed message stops
verifying. That is why #7470 scoped the change to the cache serializers. This
story has to decide the migration for the messages side (rotate, or keep a
text-answering entry point for it) before moving `coder`.

## Acceptance criteria

- `toBinary` and `fromBinary` are gone from
  `packages/activesupport/src/cache/serializer-with-fallback.ts`, and its four
  `coder.dump` / `coder.load` sites read as Rails' bodies do.
- `coder.dump` answers a binary String (one character per byte) and
  `coder.load` takes one.
- The `MessageVerifier` / `MessageEncryptor` round-trip still holds, with the
  wire-format decision recorded.
- `FileStore`'s non-ASCII round-trip test in
  `packages/activesupport/src/cache/file-store-atomic-write.trails.test.ts`
  still passes.
