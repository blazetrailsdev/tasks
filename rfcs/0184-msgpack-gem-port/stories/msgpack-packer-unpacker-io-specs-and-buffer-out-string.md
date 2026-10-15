---
title: "msgpack-packer-unpacker-io-specs-and-buffer-out-string"
status: done
updated: 2026-10-15
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8930
claim: "2026-10-15T12:26:10Z"
assignee: "message-pack-extensions-constants-seated-in-extensions-file"
blocked-by: null
closed-reason: null
---

## Context

Left open by `msgpack-packer-unpacker-remaining-specs-and-buffer-to-str`, whose
PR ported `packer_spec.rb`'s `initialize`, `msgpack ext 8/16/32 format`, the
`#register_type` one-liner contexts (`:384-490`), and converged `Buffer#toStr`
onto `msgpack_buffer_all_as_string`
(`vendor/msgpack/v1.8.0/ext/msgpack/buffer.c:507-535`: a copy, chunks left alone).

Still unported:

- `vendor/msgpack/v1.8.0/spec/packer_spec.rb:25-97`
  "gets IO or object which has #write to write/append data to it" (Tempfile,
  StringIO, `Zlib::GzipWriter`, a `DummyIO`), and the `freeze` group.
- `vendor/msgpack/v1.8.0/spec/unpacker_spec.rb`: "gets IO or object which has
  #read to read data from it", `#read` / `#each` "with a buffer", the
  `ext 8/16/32` unpack tests (`:391-410`), and the enumerator form of `each` /
  `feed_each` (`ext/msgpack/unpacker_class.c`, `RETURN_ENUMERATOR`).
- The out String of `Buffer#read` / `read_all`
  (`ext/msgpack/buffer_class.c:430-533`) resizes its second argument in place;
  the port returns a new `Uint8Array`. Needs a repo-owner ruling (a JS
  `Uint8Array` cannot be resized in place) or a convergence.
- `_msgpack_buffer_read_from_io_to_string` (`ext/msgpack/buffer.c:627-655`)
  has two arms; the port has one.
- `msgpack_buffer_ensure_writable` (`ext/msgpack/buffer.h:204-209`) has no port.

## Acceptance criteria

- The listed spec tests are ported in `packages/msgpack/src/packer.test.ts` /
  `unpacker.test.ts` under their gem names.
- The out-String and `read_from_io_to_string` shapes are converged or ruled on
  by the repo owner.
- `pnpm parity:test --package msgpack` matched count rises; no package drops.
