---
title: "io-binwrite-emits-latin1-where-mri-emits-the-strings-own-bytes"
status: draft
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IO.binwrite` (`packages/ruby-compat/src/io.ts:777-778`, `rb_io_s_binwrite`,
`vendor/ruby/v3.3.11/io.c:12396`) still sends a JS string one byte per
character through `binaryBytes` (`io.ts:123`), so a UTF-8 string lands as
latin-1:

    ruby -e 'File.binwrite("/tmp/x", "なまえ"); p File.binread("/tmp/x").bytesize'
    # => 9   (trails: 3)

MRI's binary mode only suppresses transcoding: a String is written as its own
bytes. CLAUDE.md § "A String has no encoding tag either" (ruled 2026-10-21)
settles the two seats: a JS string is UTF-8 text, and an ASCII-8BIT String is a
`Uint8Array` end to end. `IO.binread` already answers a `Uint8Array`
(`io.ts:763-765`), so the latin-1 read of a string argument is the only thing
left of the old one-character-per-byte convention here.

The one round trip that leans on it is `Migration.copy`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1074,1106`,
`source = File.binread(migration.filename)` ... `File.binwrite(migration.filename, source)`):
`packages/activerecord/src/migration.ts:1138` bridges the bytes into a latin-1
string with `Buffer.from(File.binread(...)).toString("latin1")` for the `sub!`
scan, and `:1179` writes that string back through `binwrite`. CLAUDE.md allows
the one-character-per-byte read for a regex scan over binary data ("the bytes
are read one character per byte for the scan and written back as bytes"), so
the write-back must convert to bytes itself.

## Acceptance criteria

- [ ] `IO.binwrite` writes a JS string's own UTF-8 bytes and a `Uint8Array`
      as is, as `IO#write` does; `binaryBytes` is no longer applied to a
      string argument there.
- [ ] `Migration.copy` writes `source` back as bytes (the latin-1 scan string
      turned back into a `Uint8Array`), so a migration containing UTF-8
      copies byte for byte; a test copies one holding non-ASCII text.
- [ ] `io.trails.test.ts`'s binread/binwrite tests keep their names and assert
      the UTF-8 byte count for a string argument.
