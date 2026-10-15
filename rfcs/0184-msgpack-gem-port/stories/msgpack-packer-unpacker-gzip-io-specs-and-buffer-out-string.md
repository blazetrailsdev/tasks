---
title: "msgpack-packer-unpacker-gzip-io-specs-and-buffer-out-string"
status: draft
updated: 2026-10-15
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

Split from `msgpack-packer-unpacker-io-specs-and-buffer-out-string`, whose PR
ported `unpacker_spec.rb`'s `ext 8/16/32` tests (`:390-404`) and the `#read` /
`#each` "with a buffer" contexts (`:577-612`). Still unported:

- `vendor/msgpack/v1.8.0/spec/packer_spec.rb:25-97` and
  `vendor/msgpack/v1.8.0/spec/unpacker_spec.rb:48-...` "gets IO or object
  which has #write/#read ...": they need `Zlib::GzipWriter.new(StringIO)` /
  `GzipWriter.wrap` / `GzipReader.wrap` over a StringIO. ruby-compat's
  `packages/ruby-compat/src/zlib.ts` only takes a `File`/`Tempfile` and its
  `read`/`flush`/`close` are async, so the sync Packer/Unpacker cannot drive it.
  Also packer_spec's `freeze` group.
- The out String of `Buffer#read` / `read_all`
  (`vendor/msgpack/v1.8.0/ext/msgpack/buffer_class.c:430-533`) resizes its
  second argument in place; the port returns a new `Uint8Array`. Needs a
  repo-owner ruling (a JS `Uint8Array` cannot be resized in place) or a
  convergence.
- `_msgpack_buffer_read_from_io_to_string`
  (`vendor/msgpack/v1.8.0/ext/msgpack/buffer.c:627-655`) has two arms; the port
  has one.
- `msgpack_buffer_ensure_writable` (`ext/msgpack/buffer.h:204-209`) has no port.

## Acceptance criteria

- The IO specs and the `freeze` group are ported in
  `packages/msgpack/src/packer.test.ts` / `unpacker.test.ts` under their gem
  names (extending ruby-compat Zlib to wrap a StringIO as needed).
- The out-String and `read_from_io_to_string` shapes are converged or ruled on
  by the repo owner.
- `pnpm parity:test --package msgpack` matched count rises; no package drops.
