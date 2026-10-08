---
title: "msgpack: StackError, skip, Hash maps and Decoder#pos need a read loop the engine hides"
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

`msgpack-packer-unpacker-remaining-c-surface` (RFC 0184) ported what works over
`@msgpack/msgpack`'s public `Decoder`. Five items need a read loop the engine
does not expose, and RFC 0184's non-goals rule out porting
`ext/msgpack/unpacker.c`, so they need a decision before they need code.

- **`Unpacker#read` reads `Decoder#pos`**, which the engine declares `private`
  (`packages/msgpack/src/unpacker.ts`, `read`). `decodeMulti` yields objects
  and never says how many bytes one consumed. The closest upstream request is
  msgpack/msgpack-javascript issue 128 ("Decoding only part of a stream?");
  confirm it is still open, or open one asking for a public offset.
- **`StackError`.** The gem raises it past `MSGPACK_UNPACKER_STACK_CAPACITY`
  (128) nested containers (`vendor/msgpack/v1.8.0/ext/msgpack/unpacker.c:262-264`).
  The engine's `Decoder` has no depth option.
- **A map unpacks as a plain object.** The engine's `mapKeyConverter` must
  answer a String or a number, and it refuses `__proto__`. The gem answers a
  `Hash` with any key (`unpacker.c:826-837`; `spec/unpacker_spec.rb`'s
  `sample_object` uses an Array key). `symbolize_keys` (`unpacker.c:404-410`,
  `:831-833`) is recorded by `Unpacker#isSymbolizeKeys` and converts nothing,
  because a plain object has one key type. Moving to `Hash` changes what
  `ActiveSupport::MessagePack` hands every caller.
- **`Unpacker#skip`** (`unpacker_class.c`, `Unpacker_skip`;
  `unpacker.c` `msgpack_unpacker_skip`) walks one object without building it
  or calling an ext proc. The engine can only decode.
- **A recursive ext proc** gets a child unpacker over the payload instead of
  the unpacker itself (`unpacker.c:364-391`).

Also unported, found while reading: `Packer`'s `compatibility_mode` option and
`compatibility_mode?` (`packer_class.c:117-127`, `packer.h:293,424-437`), and
`key_cache` (`unpacker_class.c:131-132`), which only interns keys.

## Acceptance criteria

- Decide, with the RFC owner, between porting `read_primitive`
  (`unpacker.c`) as `unpacker.ts`'s own loop and an upstream change; record it
  in RFC 0184's non-goals.
- `Decoder#pos` is no longer read through a cast.
- `StackError`, `Unpacker#skip`, `Hash` maps with `symbolize_keys`, and
  `compatibility_mode` are ported with their `spec/unpacker_spec.rb` /
  `spec/packer_spec.rb` tests, or blocked on the decision above.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
