---
title: "msgpack: Buffer#read / #read_all and the cruby buffer specs"
status: ready
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`msgpack-packer-unpacker-remaining-c-surface` (RFC 0184) wired
`MessagePack::Buffer` to its IO and ported `empty?`, `<<`, `skip_all`, `to_a`,
`flush`, `close` and `write_to` (`packages/msgpack/src/buffer.ts`). It stopped
at the PR's LOC ceiling with the read side unported:

- `Buffer#read` and `Buffer#read_all`
  (`vendor/msgpack/v1.8.0/ext/msgpack/buffer_class.c`, `Buffer_read`,
  `Buffer_read_all`, `read_all`, `read_until_eof`). Their second argument is
  an out String the gem resizes in place; a JS string is a primitive
  (CLAUDE.md, "Ruby Strings are JS string primitives"), so decide its shape.
- `Buffer#skip` ignores its IO: `Buffer_skip` goes through `read_until_eof`,
  the port calls `skipNonblock` only.
- `Buffer#write` flushes to its IO when the buffered bytes pass
  `io_buffer_size`. `_msgpack_buffer_expand` (`buffer.c:404-417`) flushes when
  the tail chunk is full. `read_reference_threshold` and
  `write_reference_threshold` (`buffer_class.c`,
  `MessagePack_Buffer_set_options`) are ignored.
- No spec is ported: `spec/cruby/buffer_spec.rb` (608 lines),
  `spec/cruby/buffer_io_spec.rb` (255). `buffer.trails.test.ts` covers what
  exists.
- `spec/packer_spec.rb` and `spec/unpacker_spec.rb` tests still unported:
  `initialize`, `gets IO or object which has #write to write/append data to it`,
  `gets IO or object which has #read to read data from it`, the `ext 8/16/32`
  format tests, `#read` / `#each` `with a buffer`, the enumerator form of
  `each` / `feed_each` (`unpacker_class.c`, `RETURN_ENUMERATOR`), and the
  `freeze` group.

## Acceptance criteria

- `Buffer#read`, `#read_all` and the IO arm of `#skip` are ported line for line.
- `cruby/buffer_spec.rb` and `cruby/buffer_io_spec.rb` are ported, test names
  verbatim, into `buffer.test.ts`; `buffer.trails.test.ts` keeps only what
  they do not cover.
- The listed `packer_spec.rb` / `unpacker_spec.rb` tests are ported.
- `pnpm parity:test` delta non-negative.
