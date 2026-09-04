---
title: "File.binread decodes UTF-8 where Ruby answers ASCII-8BIT bytes"
status: in-progress
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 18
pr: 7470
claim: "2026-09-04T00:19:14Z"
assignee: "extra-surface-gate-blocks-new-file-dir-members"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7444 (RFC 0135's rack flip), where `Rack::Multipart::UploadedFile`
needed a byte-exact read and could not use `File.binread` for it.

`File.binread` is `rb_io_s_binread` (`vendor/ruby/io.c:12242`), which answers an
`ASCII-8BIT` String — the file's BYTES, one character per byte. trails'
`File.binread` (`packages/ruby-compat/src/file.ts`) is

```ts
static binread(name: string): string {
  return getFs().readFileSync(name, "utf-8");
}
```

which is `File.read` (`file.ts`, `IO.read` at `io.c:12200`) under the other
name: a multi-byte UTF-8 sequence decodes to ONE JS character, so
`binread(path).length` is below the file's byte length and any caller treating
the result as a byte sequence is wrong. `IO#read`, added in #7444
(`packages/ruby-compat/src/io.ts`, `io_read` at `io.c:3774`), already does the
byte-exact thing — it assembles the string with `String.fromCharCode` per byte,
because no `TextDecoder` encoding gives latin1 (its "latin1" is windows-1252,
which remaps 0x80-0x9F).

The reason #7444 did not just fix `binread` is that its ONE caller pairs it
with a non-`File` writer. `FileStore#readSerializedEntry`
(`packages/activesupport/src/cache/file-store.ts:172`, Rails
`activesupport/lib/active_support/cache/file_store.rb:121-126`) reads with
`File.binread`, but `writeSerializedEntry` (`file-store.rb:132-137`) writes
through `atomicWrite`, which lands a JS string as UTF-8. Today the two agree
because both are UTF-8; changing only the read breaks the round-trip for any
non-ASCII payload. `IO.binwrite` (`io.ts`, `rb_io_s_binwrite` at `io.c:12396`)
has the mirror-image bug: it answers `string.length` as the byte count, which
is only correct under latin1, while writing UTF-8.

So this is one convergence with three seats, not three bugs.

## Converged shape

- `File.binread` and `IO.binread` answer bytes: read the file as a byte
  sequence and assemble one character per byte, the way `IO#read` in `io.ts`
  already does. Factor the byte-to-binary-String step rather than writing it a
  third time.
- `IO.binwrite` writes those bytes back — a binary String must round-trip
  through the pair unchanged — and keeps answering the byte count it already
  answers (`io_s_write`, `io.c:12285`).
- `File.atomic_write` in activesupport is checked against the pair, since
  `FileStore` reads with `binread` what `atomicWrite` wrote; whichever side
  moves, the round-trip is what has to hold.
- A test writes non-ASCII content through the writer and reads it back through
  `binread`, asserting both the content and that `.length` equals the byte
  count. That test fails on today's `binread` for the length assertion.

## Acceptance criteria

- `File.binread` / `IO.binread` answer one character per byte for a file
  containing non-ASCII bytes, and `binread(p).length` equals the file's size.
- The `IO.binwrite` -> `binread` round-trip preserves non-ASCII content.
- `FileStore`'s cache round-trip still holds for a non-ASCII payload (a test
  covers it).
- No caller needs a `"latin1"` / `"utf-8"` argument at a `File`/`IO` call site
  to pick the behaviour; the member name carries it, as it does in Ruby.
