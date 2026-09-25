---
title: "io-binwrite-emits-latin1-where-mri-emits-the-strings-own-bytes"
status: draft
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IO#write` on a binmode stream now sends a JS string's own bytes, its UTF-8,
matching MRI (`vendor/ruby/io.c:1904` `do_writeconv`; binmode only suppresses the
transcode). `IO.binwrite` (`packages/ruby-compat/src/io.ts`, `rb_io_s_binwrite`,
`vendor/ruby/io.c:12396`) still sends one byte per character through
`binaryBytes`, so a UTF-8 string handed to it lands as latin-1:

    ruby -e 'File.binwrite("/tmp/x", "なまえ"); p File.binread("/tmp/x").bytesize'
    # => 9   (trails: 3)

It is left byte-per-char because it is `IO.binread`'s twin: `binread` answers an
ASCII-8BIT String as one JS char per byte, and every current caller hands
`binwrite` such a string back:

- `activerecord/src/migration.ts:1094` — `File.binwrite(source.filename, ...)`,
  Rails `migration.rb:1106` `File.binwrite(migration.filename, source)`, where
  `source` came from `File.binread` (`migration.ts:1071`). Converging only the
  write half would double-encode a UTF-8 migration.
- `activesupport/src/encrypted-file.ts:103` — base64 ASCII, unaffected.
- `ruby-compat/src/io.trails.test.ts` "binread answers one character per byte,
  and binwrite writes them back".

## Acceptance criteria

- `IO.binwrite` writes a string's own bytes (UTF-8), and accepts a `Uint8Array`
  for an ASCII-8BIT String's bytes, as `IO#write` does.
- Every `binread` → `binwrite` round trip (migration copy above) passes bytes,
  not a byte-per-char string, so a UTF-8 migration copies byte-for-byte.
- The two io.trails.test.ts binwrite tests keep their names.
