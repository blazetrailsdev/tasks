---
title: "Zlib::GzipReader.open / GzipWriter.open, so SchemaCache.read stops opening the .gz itself"
status: blocked
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 2
pr: null
claim: "2026-09-04T14:50:46Z"
assignee: "port-zlib-gzipreader-open-for-schema-cache-read"
blocked-by: "Needs the ruby-compat Zlib seam that zlib-seam-is-the-last-static-node-builtin is still building: packages/ruby-compat/src/zlib-adapter.ts exists only on the unmerged PR #7483, and origin/main's ruby-compat/src/zlib.ts holds crc32 alone. GzipReader.open/GzipWriter.open cannot compress or decompress in a leaf package without that adapter, and the AC forbids a node:zlib import there. Building it now would stack on #7483 and conflict on both zlib.ts and gzip.ts. Unblock once #7483 merges."
closed-reason: null
---

## Context

`ActiveRecord::ConnectionAdapters::SchemaCache.read`
(`activerecord/lib/active_record/connection_adapters/schema_cache.rb:244-252`) is

```ruby
def self.read(filename, &block)
  if File.extname(filename) == ".gz"
    Zlib::GzipReader.open(filename) { |gz|
      yield gz.read
    }
  else
    yield File.read(filename)
  end
end
```

and `dump_to` (`schema_cache.rb:406-413`) is its `Zlib::GzipWriter.open` mirror.

trails has no `Zlib::GzipReader` / `GzipWriter`, so
`packages/activerecord/src/connection-adapters/schema-cache.ts:107-113,383-391`
opens the file itself in binary mode and hands the bytes to
`Gzip.decompress` / `Gzip.compress`:

```ts
const raw = File.open(filename, "rb", (f) => f.read());
return callback(Gzip.decompress(raw));
```

PR #7462 baselined the resulting call-argument row
(`activerecord/connection-adapters/schema-cache.json`, `open(ref:filename)`) —
Rails' `open` takes the filename alone because the gzip stream carries the mode
and the decode; trails' takes a mode and a block. The `open` call itself is now
made, so only the argument shape diverges.

This is the same seam RFC 0129's `one-home-for-ruby-zlib-crc32` and
`zlib-seam-is-the-last-static-node-builtin` are already working: the file-level
`GzipReader`/`GzipWriter` classes are the piece neither of those covers.

## Acceptance criteria

- `Zlib::GzipReader.open(filename, &block)` and `Zlib::GzipWriter.open` land on
  the trails Zlib seam, citing `vendor/ruby/ext/zlib/zlib.c` for each, with the
  block form closing the stream on the way out the way `File.open` does.
- `schema-cache.ts` `read` and `dump_to` call them with Rails' argument list —
  the filename alone — and stop opening the file themselves.
- The `open(ref:filename)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/schema-cache.json`
  (only-shrink: delete by hand, no reseed); `pnpm parity:api:calls` and
  `pnpm parity:api:calls:args` are green.
- The `.gz` round-trip stays byte-exact — `schema-cache.test.ts` and
  `schema-cache.trails.test.ts` keep their names and pass unchanged.
- No `node:zlib` import lands in `ruby-compat` (leaf rule); the seam is reached
  the way the existing Zlib work reaches it.
