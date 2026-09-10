---
title: "IO#write takes bytes so rack/zlib stop relying on binmode's latin-1 string arm"
status: ready
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 130
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Prerequisite of the blocked `binmode-write-emits-latin1-where-mri-emits-the-strings-own-bytes`.
`IO#write` (`packages/ruby-compat/src/io.ts:811`) decides byte-vs-text from the
stream encoding (`doWriteconv`, `io.ts:201`): a binmode stream writes a JS
string latin-1 (`binaryBytes`). MRI writes the String's own bytes
(`vendor/ruby/io.c:1904` `do_writeconv`), so UTF-8 text on a binmode stream
lands as UTF-8.

Converging `doWriteconv` today corrupts every producer that relies on the
latin-1 arm to write genuinely binary data as a byte-per-char JS string:

- `packages/rack/src/multipart/parser.ts:240` `onMimeBody` writes chunks from
  `io.read` (binary strings) into a binmode tempfile
  (`uploaded-file.ts:46`, `parser.ts:224`). Rack:
  `rack/lib/rack/multipart/parser.rb` `on_mime_body` → `body << content`.
- `packages/ruby-compat/src/zlib.ts:107` `GzipWriter#close` builds `out` with
  `String.fromCharCode` per gzip byte.

## Converged shape

`IO#write` accepts `Uint8Array` and writes it verbatim; the byte producers
above hand it bytes (zlib passes `gzipped`, rack keeps byte chunks), so the
string arm of a binmode stream can become UTF-8, as MRI does.

## Acceptance criteria

- [ ] `IO#write(Uint8Array)` writes the bytes unchanged.
- [ ] `GzipWriter#close` and rack multipart bodies write bytes; a non-ASCII
      binary upload round-trips byte-for-byte.
- [ ] Unblocks `binmode-write-emits-latin1-where-mri-emits-the-strings-own-bytes`.
