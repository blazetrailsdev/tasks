---
title: "binmode-write-emits-latin1-where-mri-emits-the-strings-own-bytes"
status: blocked
updated: 2026-09-10
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: 160
pr: null
claim: "2026-09-10T12:37:56Z"
assignee: "mysql2-internal-execute-and-exec-query-overrides-rails-lacks"
blocked-by: "rack multipart parser writes latin-1 binary strings from io.read into binmode tempfiles (packages/rack/src/multipart/parser.ts:240); UTF-8-encoding binmode strings corrupts non-ASCII uploads until rack (and other binary-string producers) can hand IO#write bytes"
closed-reason: null
---

## Context

`IO#write` (`packages/ruby-compat/src/io.ts:811`) hands its string to
`doWriteconv` (`io.ts:201`), whose ASCII-8BIT arm calls `binaryBytes(string)` —
one JS char per byte, latin-1. That arm is reached whenever the stream has been
put in binmode, because `IO#binmode` (`io.ts:457`) faithfully mirrors MRI's
`io_ascii8bit_binmode` (`vendor/ruby/io.c:6349`, reached from
`rb_io_binmode_m` at `io.c:6379`) in setting the stream's encoding to
ASCII-8BIT.

In MRI that encoding only suppresses _transcoding_; the String's own bytes go
out. A UTF-8 String written to a binmode stream therefore lands as UTF-8 bytes:

    ruby -e 'require "tempfile"; Tempfile.open("x") { |f| f.binmode; f.write("なまえ"); f.close; p File.binread(f.path).bytesize }'
    # => 9

trails emits three latin-1 bytes instead, because a JS string carries no
encoding tag and the ASCII-8BIT arm has to guess. Both readings are needed in
the same stream: `Zlib::GzipWriter`'s output really is a byte-per-char string,
while a JSON dump written through the same `File.atomic_write` binmode tempfile
(`activesupport/core_ext/file/atomic.rb:25`) really is UTF-8 text.

Surfaced by `schema-cache-read-is-public-and-open-sets-an-encoding-rails-does-not`
(#7631). `SchemaCache#open`'s non-gz arm
(`packages/activerecord/src/connection-adapters/schema-cache.ts:475`) carries a
`file.setEncoding(Encoding.UTF_8)` that Rails
(`activerecord/lib/active_record/connection_adapters/schema_cache.rb:470-472`)
does not, purely to steer `doWriteconv` back to `TextEncoder`. Removing it reds
`schema-cache.trails.test.ts:241`, which round-trips a `なまえ` column
(`"なまえ"` becomes `"j~H"`). That deviation cannot converge until this one does.

## Converged shape

Move the byte/text decision off the stream's encoding and onto what the caller
hands `IO#write`: accept a `Uint8Array` for genuinely binary payloads and have
`Zlib::GzipWriter` (and any other byte producer) pass bytes, so a plain JS
string on a binmode stream can be written as its UTF-8 bytes, matching MRI.
Then delete the `setEncoding` call from `SchemaCache#open` and close the
half of the surfacing story that this blocks.

## Acceptance criteria

- [ ] A string written to a binmode `IO` lands as its UTF-8 bytes, matching the
      MRI check above.
- [ ] `Zlib::GzipWriter` output still round-trips byte-for-byte through a
      binmode stream.
- [ ] `SchemaCache#open`'s non-gz arm is `block(file)` with no `setEncoding`,
      matching `schema_cache.rb:470-472`, and
      `schema-cache.trails.test.ts`'s non-gz `なまえ` round trip passes.
- [ ] `io.trails.test.ts` and `tempfile.trails.test.ts` keep their names.
