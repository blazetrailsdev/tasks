---
title: "msgpack: Buffer#write flushes to its IO; cruby/buffer_spec.rb and the remaining packer/unpacker specs"
status: ready
updated: 2026-10-13
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open by `msgpack-buffer-read-and-cruby-buffer-specs` (RFC 0184), which
ported `Buffer#read`, `#read_all`, the IO arm of `#skip`
(`packages/msgpack/src/buffer.ts`) and `spec/cruby/buffer_io_spec.rb`
(`packages/msgpack/src/cruby/buffer-io.test.ts`), and stopped at the PR's LOC
ceiling.

Still unported:

- **The write side.** `Buffer#write` never flushes to its IO.
  `msgpack_buffer_append_string`
  (`vendor/msgpack/v1.8.0/ext/msgpack/buffer.h:238-250`) sends a string longer
  than `write_reference_threshold` to `_msgpack_buffer_append_long_string`
  (`buffer.c:330-343`), which flushes and writes straight to the IO.
  `_msgpack_buffer_expand` (`buffer.c:404-417`) flushes when the tail chunk is
  full. `read_reference_threshold` and `write_reference_threshold`
  (`buffer_class.c:186-210`, `MessagePack_Buffer_set_options`) are ignored by
  `setOptions`.
- **The out String of `read` / `read_all`.** `Buffer_read` and
  `Buffer_read_all` (`buffer_class.c:430-533`) resize their second argument in
  place and return it. The port type-checks it (`CHECK_STRING_TYPE`) and
  returns a new `Uint8Array`, since neither a JS string nor a `Uint8Array` can
  be resized in place (CLAUDE.md, "Ruby Strings are JS string primitives"). No
  spec passes it. Decide whether that is the final shape.
- **`_msgpack_buffer_read_from_io_to_string`** (`buffer.c:627-655`) has two
  arms, a direct read into an empty string and a copy through `io_buffer`. The
  port has one, because a JS IO cannot fill a caller's buffer.
- **`spec/cruby/buffer_spec.rb`** (608 lines) is not ported. It maps to
  `packages/msgpack/src/cruby/buffer.test.ts`. `buffer.trails.test.ts` still
  holds the one test that covers skip, flush and feed together.
- **`spec/packer_spec.rb` and `spec/unpacker_spec.rb`** tests still unported:
  `initialize`, `gets IO or object which has #write to write/append data to it`,
  `gets IO or object which has #read to read data from it`, the
  `ext 8/16/32` format tests, `#read` / `#each` `with a buffer`, the enumerator
  form of `each` / `feed_each` (`unpacker_class.c`, `RETURN_ENUMERATOR`), and
  the `freeze` group.

The random specs in `buffer_io_spec.rb` build up to 4 x 1.4 MB per iteration,
50 iterations each. `buffer-io.test.ts` draws fragments from one shared random
pool and compares bytewise to stay inside the test timeout; `buffer_spec.rb`'s
random tests need the same care.

## Acceptance criteria

- `Buffer#write` flushes to its IO where `msgpack_buffer_append_string` and
  `_msgpack_buffer_expand` do, and `setOptions` reads both reference
  thresholds.
- `cruby/buffer_spec.rb` is ported, test names verbatim, into
  `packages/msgpack/src/cruby/buffer.test.ts`; `buffer.trails.test.ts` keeps
  only what the two cruby specs do not cover.
- The listed `packer_spec.rb` / `unpacker_spec.rb` tests are ported.
- `pnpm parity:test` delta non-negative.
