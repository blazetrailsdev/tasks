---
title: "Zlib::GzipReader#read answers bytes for every caller; port external_encoding so a text reader reads text"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8520. `Zlib::GzipReader#read`
(`rb_gzreader_read`, `vendor/ruby/v3.3.11/ext/zlib/zlib.c:4009`) answers the
inflated bytes tagged with the reader's encoding: `gzfile_newstr`
(`zlib.c:2859-2873`) associates `gz->enc`, the default external encoding unless
`external_encoding:` was given to `new` / `open` (`rb_gzfile_set_encoding` /
`gzfile_initialize` options). A text caller therefore reads UTF-8 and a binary
caller reads the same bytes.

trails' `GzipReader#read` (`packages/ruby-compat/src/zlib.ts`) answers one
character per byte since #8520, because the schema cache `.dump` arm needs the
bytes, and its one caller, `SchemaCache.read`
(`packages/activerecord/src/connection-adapters/schema-cache.ts`,
`schema_cache.rb:244-252`), decodes the YAML arm with `forceEncoding`. `Zlib`
is a published `@blazetrails/ruby-compat` export, so any other text reader gets
undecoded bytes with nothing in the signature saying so, and `GzipReader.open`
has no `external_encoding:` to ask for either reading.

## Acceptance criteria

- [ ] `GzipReader.new` / `.open` take MRI's `external_encoding:` option, and
      `read` answers a string in that encoding: decoded text for the default
      external encoding, one character per byte for `Encoding::BINARY`, the way
      `File.open` / `IO#read` already model it in `io.ts`.
- [ ] `SchemaCache.read` passes what it needs and its `forceEncoding` call and
      `@inventedArm forceEncoding` receipt are re-examined against that shape.
- [ ] `zlib.trails.test.ts` covers a non-ASCII payload read both ways.

## Verification

`pnpm vitest run packages/ruby-compat/src/zlib.trails.test.ts packages/activerecord/src/connection-adapters/schema-cache.test.ts packages/activerecord/src/connection-adapters/schema-cache.trails.test.ts`.
