---
title: "msgpack: port msgpack_buffer_ensure_writable and call it from the packer"
status: draft
updated: 2026-11-12
rfc: "0123-blocked-convergence-holding"
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

`msgpack_buffer_ensure_writable` (`vendor/msgpack/v1.8.0/ext/msgpack/buffer.h:204-209`)
expands the tail chunk when `msgpack_buffer_writable_size` is below `require`
(`_msgpack_buffer_expand(b, NULL, require, true)`, flushing to the IO). The packer
calls it before every fixed-size write (`ext/msgpack/packer.h:79-97` and on).
`packages/msgpack/lib/buffer.ts` has `expand` (`:461`) but no `ensureWritable`, and
`packages/msgpack/lib/packer.ts` writes go through `appendImpl` without it. This was split
from msgpack-packer-unpacker-gzip-io-specs-and-buffer-out-string (trails#10042).

## Acceptance criteria

- `Buffer#ensureWritable(require)` is ported at its C name and body, built on
  `writableSize` and `expand(null, require, true)`.
- The packer's write paths call it where `packer.h` does.
- `pnpm parity:api --package msgpack` matched count does not drop.
