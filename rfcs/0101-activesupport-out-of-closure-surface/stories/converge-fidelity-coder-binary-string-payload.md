---
title: "converge-fidelity-coder-binary-string-payload"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6446
claim: "2026-08-13T00:16:48Z"
assignee: "converge-fidelity-coder-binary-string-payload"
blocked-by: null
closed-reason: null
---

## Context

Surfaced enrolling `CacheStoreCompressionBehavior` (PR #6444). Thirteen of its
fourteen cases are green for FileStore and MemoryStore; the fourteenth,
`compression ignores incompressible data`
(`vendor/rails/activesupport/test/cache/behaviors/cache_store_compression_behavior.rb:71-74`),
cannot hold as written:

```ruby
test "compression ignores incompressible data" do
  assert_not_compress "", with: { compress: true, compress_threshold: 1 }
  assert_not_compress [*0..127].pack("C*"), with: { compress: true, compress_threshold: 1 }
end
```

Ruby's `Marshal.dump` emits the 128 ASCII bytes raw, so deflating them grows the
payload and `Marshal70WithFallback#dump_compressed`
(serializer_with_fallback.rb:77-86) keeps the uncompressed arm. trails' fidelity
coder (`packages/activesupport/src/cache/coder.ts`) is JSON-based, so the same
value dumps as a run of `\uXXXX` escapes -- 275 bytes that deflate to 191.
Compression kicks in and the case reads a reduction of 84 where Rails reads 0.

Measured on `FileStore` (MemoryStore's `DupCoder` payload is an `Entry`, so it
is unaffected). The behavior helper's `sizeOf` is a second-order problem in the
same area: it counts UTF-8 bytes (`TextEncoder`), but a compressed payload is a
latin1 string out of `gzip.ts`'s `deflate`, whose true `bytesize` is its
`.length` -- so the helper reported 291 for a 191-byte payload.

## Acceptance criteria

- [ ] A binary-ish string round-trips through the cache serializer with a
      payload whose byte count tracks the value's, so deflating it is a loss --
      i.e. `compression ignores incompressible data` holds.
- [ ] The behavior helper's `sizeOf` counts bytes the way Ruby `#bytesize`
      does for both the JSON and the latin1-compressed payload shapes.
- [ ] `compression ignores incompressible data` is enrolled verbatim in
      `packages/activesupport/src/cache/behaviors/cache-store-compression-behavior.ts`
      and green for FileStore and MemoryStore (14/14).
