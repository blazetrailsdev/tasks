---
title: "Port Zlib.deflate/inflate over bytes; Cache::Store defaults its compressor to Zlib"
status: draft
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Cache::Store#initialize` defaults the compressor to Ruby's
`Zlib` module (`vendor/rails/activesupport/lib/active_support/cache.rb:305`,
`@options.delete(:compressor) { Zlib }`). `Zlib.deflate` / `Zlib.inflate`
(`vendor/ruby/ext/zlib/zlib.c:4715,4727`) read and return bytes.

trails' default is `const Zlib: CoderCompressor = { deflate, inflate }`
(`packages/activesupport/src/cache/store.ts:35`), built from
`packages/activesupport/src/gzip.ts:31-37`. Its `deflate` reads its argument as
**UTF-8** (`Buffer.from(source, "utf8")`), and `inflate` returns UTF-8. Since
trails#8091, `Cache::Coder` hands the compressor a binary payload: one code unit
per byte, from `b(entry.value)` or a serializer's latin1 output. `deflate`
therefore encodes every byte from `0x80` up as two bytes. The data still round-trips,
but it compresses a larger input than Rails does. That skews the
`compressed.bytesize < string.bytesize` check in `Coder#try_compress`
(`cache/coder.rb:130-135`). ruby-compat has no `Zlib.deflate` / `Zlib.inflate` at all
(`packages/ruby-compat/src/zlib.ts`).

## Converged shape

- ruby-compat ports `Zlib.deflate(string, level = DEFAULT_COMPRESSION)` / `Zlib.inflate(string)` from `zlib.c` (`rb_deflate_s_deflate` / `rb_inflate_s_inflate`), bytes in and bytes out in the binary code-unit-per-byte convention.
- `Store` defaults the compressor to ruby-compat's `Zlib`, as `cache.rb:305` does, and the invented `const Zlib` in `store.ts` goes away.

## Acceptance criteria

- [ ] `Zlib.deflate` / `Zlib.inflate` exist in ruby-compat, each tested against `ruby`, including bytes `0x80`-`0xff`.
- [ ] The cache store's default compressor is that `Zlib`, and compressing a binary payload does not UTF-8-expand it.
