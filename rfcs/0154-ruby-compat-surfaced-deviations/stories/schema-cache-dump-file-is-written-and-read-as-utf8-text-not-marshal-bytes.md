---
title: "SchemaCache .dump files are written and read as UTF-8 text, not Marshal's bytes"
status: draft
updated: 2026-10-05
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

Surfaced by `ruby-compat-has-no-marshal-for-schema-cache-and-debug`, which
wired `Marshal.dump(self)` / `Marshal.load(file)` into `SchemaCache#dump_to` /
`._load_from`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:232-233,408-409`;
`packages/activerecord/src/connection-adapters/schema-cache.ts`).

`Marshal.dump` answers an ASCII-8BIT String (`vendor/ruby/v3.3.11/marshal.c:1241`),
which ruby-compat spells as a JS string with one character per byte. Rails
writes those bytes with `f.write` and reads them back with `File.read` /
`Zlib::GzipReader#read` (`schema_cache.rb:244-252,461-475`). trails' ports of
those calls treat a JS string as UTF-8 text:

- `IO#write` (`packages/ruby-compat/src/io.ts`, `doWriteconv`) and
  `GzipWriter#write` (`packages/ruby-compat/src/zlib.ts`) run the string
  through `TextEncoder`, so every byte >= 0x80 is written as two bytes.
- `File.read` and `GzipReader#read` decode UTF-8, so a byte >= 0x80 that is not
  valid UTF-8 comes back as U+FFFD.

A trails-written `.dump` therefore round-trips through trails but is not the
file Rails writes, and a Rails-written `.dump` is misread. Measured: the
checked-in fixture
`packages/activerecord/src/test-helpers/support/schema_cache_fixtures/rails_8_0_2_sqlite3.dump`
holds version `20240101000000`, whose Bignum bytes include `0x80`.
`Marshal.load(File.binread(path))` answers `20240101000000`;
`Marshal.load(File.read(path))` answers `20242131057984`, with no error.

`ActiveSupport::Cache::FileStore` already has the byte-exact shape for the same
problem: `f.write(Buffer.from(payload, "latin1"))` and `File.binread`
(`packages/activesupport/src/cache/file-store.ts:125,140`).

## Acceptance criteria

- [ ] A `.dump` (and `.dump.gz`) written by `SchemaCache#dumpTo` holds exactly
      the bytes `Marshal.dump` answers, one byte per character.
- [ ] `SchemaCache._loadFrom` hands `Marshal.load` the file's bytes, for the
      plain and the gzip arm, and the YAML arm still reads UTF-8 text.
- [ ] `schema-cache.trails.test.ts`'s Rails-fixture test loads through
      `SchemaCache._loadFrom(path)` in place of `Marshal.load(File.binread(path))`
      and still answers version `20240101000000`.
- [ ] A cache with a non-ASCII table name and one with a string longer than
      127 bytes round-trip through `.dump` and `.dump.gz`.

## Verification

`pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts packages/activerecord/src/connection-adapters/schema-cache.trails.test.ts`.
