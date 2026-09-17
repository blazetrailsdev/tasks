---
title: "binmode-write-emits-latin1-where-mri-emits-the-strings-own-bytes"
status: ready
updated: 2026-09-16
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: 160
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IO#write` (`packages/ruby-compat/src/io.ts`) hands its string to `doWriteconv`.
Its ASCII-8BIT arm (`io.ts:302`) calls `binaryBytes(string)`: one JS char per
byte, latin-1. That arm is reached whenever the stream is in binmode, because
`IO#binmode` faithfully mirrors MRI's `io_ascii8bit_binmode`
(`vendor/ruby/io.c:6349`, reached from `rb_io_binmode_m` at `io.c:6379`) and sets
the stream's encoding to ASCII-8BIT.

In MRI that encoding only suppresses transcoding, and the String's own bytes go
out. A UTF-8 String written to a binmode stream lands as UTF-8 bytes:

    ruby -e 'require "tempfile"; Tempfile.open("x") { |f| f.binmode; f.write("なまえ"); f.close; p File.binread(f.path).bytesize }'
    # => 9

trails emits three latin-1 bytes instead.

`SchemaCache#open`'s non-gz arm
(`packages/activerecord/src/connection-adapters/schema-cache.ts:473`) carries a
`file.setEncoding(Encoding.UTF_8)` that Rails (`schema_cache.rb:470-472`) does
not. It exists only to steer `doWriteconv` back to `TextEncoder`. Removing it
reds the non-gz `なまえ` round trip in `schema-cache.trails.test.ts`.

**The earlier blocker is gone.** trails#7683 let `IO#write` take bytes. The rack
multipart parser now writes a `Uint8Array`
(`packages/rack/src/multipart/parser.ts:240`), and `Zlib::GzipWriter` already did.

Byte-per-char producers still to check, as found on trails `0236d460b2`:

- `IO.binwrite` (`io.ts:713-714`) converts its string through `binaryBytes`
  directly, with no `doWriteconv` involved. Its callers are:
  - `activerecord/src/migration.ts:1100`, which writes migration source text that
    can contain UTF-8 (Rails `migration.rb:1106` `File.binwrite(migration.filename, source)`);
  - `activesupport/src/encrypted-file.ts:102`.
- `File.open(path, "…b")` (`ruby-compat/src/file.ts:355`),
  `activesupport/core-ext/file/atomic.ts:22`, and the rack / rack-test
  `uploaded-file.ts` tempfiles. These put a stream in binmode. Every string
  written to one must be a genuine text string, not a byte-per-char one.

## Acceptance criteria

- A string written to a binmode `IO` lands as its UTF-8 bytes, matching the MRI
  check above. `IO.binwrite` agrees, or its divergence is filed with the
  `migration.ts:1100` evidence.
- Every byte-per-char producer that writes to a binmode stream passes a
  `Uint8Array`. The PR lists each writer it checked.
- `Zlib::GzipWriter` output still round-trips byte-for-byte through a binmode
  stream.
- `SchemaCache#open`'s non-gz arm is `block(file)` with no `setEncoding`, matching
  `schema_cache.rb:470-472`, and `schema-cache.trails.test.ts`'s non-gz `なまえ`
  round trip passes.
- `io.trails.test.ts` and `tempfile.trails.test.ts` keep their test names.
