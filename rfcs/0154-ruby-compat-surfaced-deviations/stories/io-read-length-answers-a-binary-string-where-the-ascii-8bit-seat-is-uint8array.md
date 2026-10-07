---
title: "ruby-compat: IO#read(length) answers a one-char-per-byte string where the ASCII-8BIT seat is a Uint8Array"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `IO#read(length)` answers an ASCII-8BIT String whatever the stream's mode
(`vendor/ruby/v3.3.11/io.c:3774` `io_read`, buffering into `rb_str_new` through
`io_setstrbuf`, `io.c:3278`). ruby-compat has two seats for that String. `rbObjEncoding`
(`packages/ruby-compat/src/string/force-encoding.ts`) reads a `Uint8Array` as ASCII-8BIT and a
JS string as UTF-8, and `IO#write` and `GzipWriter#write` take a `Uint8Array` as an ASCII-8BIT
String's bytes. But `IO#read(length)` (`packages/ruby-compat/src/io.ts`, `read`) and
`StringIO#read(length)` answer a JS string with one character per byte, which every writer
then encodes as UTF-8 unless the caller converts it by hand.

That mismatch corrupted every static file with a byte at or above 0x80 (trails#8634). The fix
there could not converge the Rack body: `Rack::Files::BaseIterator#each_range_part`
(`vendor/rack/v3.1.14/lib/rack/files.rb:171-181`) is `part = file.read([8192, remaining_len].min)`
and `yield part`, and the port (`packages/rack/src/files.ts`, `eachRangePart`) instead passes an
out-buffer as a second argument and yields the buffer, under a
`@missingRailsArgs read — CONVERGEABLE` receipt naming this story.

The same string seat is still live at:

- `packages/actionpack/src/action-dispatch/http/response.ts:196-204`, `FileBody#each`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/data_streaming.rb`, `FileBody#each`):
  `yield chunk` hands the server a one-character-per-byte string, so `send_file` of a file with
  a high byte is written as UTF-8 and overruns `content-length`, the trails#8634 bug on another
  path. `FileBody#body` (`IO.binread`) has the same shape.
- `packages/rack/src/deflater.ts:136-141`, `GzipStream#each`'s `File` arm
  (`vendor/rack/v3.1.14/lib/rack/deflater.rb`, `GzipStream#each`): `gzip.write(part)` is spelled
  `gzip.write(Buffer.from(String(part), "binary"))` to undo the string seat.
- `packages/rack/src/mock-response.ts`, `MockResponse#body`
  (`vendor/rack/v3.1.14/lib/rack/mock_response.rb:60-66`): `buffer << chunk` spells a byte chunk
  into a one-character-per-byte string by hand.
- `packages/ruby-compat/src/zlib-adapter.ts:236`, `packages/rack/src/multipart/parser.ts:73,381`
  and `packages/actionpack/src/action-dispatch/http/upload.ts:39`, which read with a length.

## Acceptance criteria

- [ ] `IO#read(length)`, `IO#readpartial` and `StringIO#read(length)` answer a `Uint8Array`, the
      ASCII-8BIT seat `rbObjEncoding` already reads. The no-argument arm keeps answering the
      external encoding.
- [ ] `Rack::Files::BaseIterator#eachRangePart` is `const part = file.read(Math.min(8192, remainingLen))`
      and yields `part`. Its `@missingRailsArgs read` receipt is deleted.
- [ ] `FileBody#each` yields bytes. A test through a listening `Handler.Node` receives a
      `send_file` of a file with multi-byte UTF-8, and one of arbitrary bytes, byte-identical with
      `content-length` equal to the bytes received.
- [ ] `GzipStream#each`'s `File` arm is `gzip.write(part)`.
- [ ] Every other caller that reads with a length is updated, and none converts the result with
      `Buffer.from(..., "binary")` or a `String.fromCharCode` loop.
