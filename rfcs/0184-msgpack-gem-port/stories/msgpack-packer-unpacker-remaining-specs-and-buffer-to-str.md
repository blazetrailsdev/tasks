---
title: "msgpack-packer-unpacker-remaining-specs-and-buffer-to-str"
status: ready
updated: 2026-10-14
rfc: "0184-msgpack-gem-port"
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

Left open by `msgpack-buffer-write-flush-and-cruby-buffer-spec` (RFC 0184),
which ported the tail-chunk write path of `Buffer`
(`packages/msgpack/src/buffer.ts`: `appendImpl`, `expand`, `chunkMalloc`,
`chunkRealloc`, `appendReference`, both reference thresholds in `setOptions`)
and `spec/cruby/buffer_spec.rb`
(`packages/msgpack/src/cruby/buffer.test.ts`), and stopped at the PR's LOC
ceiling.

Still unported:

- **`spec/packer_spec.rb`** (`packages/msgpack/src/packer.test.ts`, 23 of 46
  matched): `initialize`,
  `gets IO or object which has #write to write/append data to it`, the
  `ext 8/16/32` format tests, and the `freeze` group.
- **`spec/unpacker_spec.rb`** (`packages/msgpack/src/unpacker.test.ts`, 19 of
  67 matched): `gets IO or object which has #read to read data from it`,
  `#read` / `#each` `with a buffer`, and the enumerator form of `each` /
  `feed_each` (`vendor/msgpack/v1.8.0/ext/msgpack/unpacker_class.c`,
  `RETURN_ENUMERATOR`).
- **The out String of `read` / `read_all`.** `Buffer_read` and
  `Buffer_read_all` (`vendor/msgpack/v1.8.0/ext/msgpack/buffer_class.c:430-533`)
  resize their second argument in place and return it. The port type-checks it
  (`CHECK_STRING_TYPE`) and returns a new `Uint8Array`. No spec passes it.
  Decide whether that is the final shape.
- **`_msgpack_buffer_read_from_io_to_string`**
  (`vendor/msgpack/v1.8.0/ext/msgpack/buffer.c:627-655`) has two arms, a direct
  read into an empty string and a copy through `io_buffer`. The port has one.
- **`msgpack_buffer_all_as_string`** (`buffer.c:502-535`) copies and leaves the
  chunk list alone. `Buffer#toStr` collapses `chunks` into one chunk and
  returns that chunk itself.
- **`msgpack_buffer_ensure_writable`** (`buffer.h:204-209`), the
  `data == NULL` caller of `_msgpack_buffer_expand`, has no port: the packer
  writes whole encoded values through `Buffer#write`.

## Acceptance criteria

- The listed `packer_spec.rb` / `unpacker_spec.rb` tests are ported, test
  names verbatim.
- `Buffer#toStr` leaves `chunks` as it found them.
- The out-String and `read_from_io_to_string` shapes are either converged or
  ruled on by the repo owner.
- `pnpm parity:test` delta non-negative.
