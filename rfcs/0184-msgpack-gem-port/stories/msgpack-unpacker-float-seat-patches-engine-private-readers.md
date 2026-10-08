---
title: "msgpack: Unpacker seats a Float by replacing the engine's private readF32/readF64 through a cast"
status: draft
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
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

trails#8688 made `Unpacker` answer a Float for `0xca` / `0xcb`, as
`read_primitive` does with `rb_float_new`
(`vendor/msgpack/v1.8.0/ext/msgpack/unpacker.c:525-536`). `@msgpack/msgpack`'s
`Decoder` answers a JS number and has no float hook, so
`packages/msgpack/src/unpacker.ts`'s constructor replaces the engine's private
`readF32` / `readF64` on the decoder instance through a cast and seats the
result with `rbDbl2num`. It also passes a `mapKeyConverter` that copies the
engine's default check and message and adds one arm unboxing a Float key,
because the engine refuses an object key.

Both are the same class of debt as the `Decoder#pos` cast that
`msgpack-unpacker-read-loop-the-engine-hides` owns, but that story's acceptance
criteria do not name them.

## Acceptance criteria

- `unpacker.ts` no longer assigns `readF32` / `readF64` on the engine through a
  cast: the Float is seated by `unpacker.ts`'s own `read_primitive` port, or by
  a public engine hook.
- The copied `mapKeyConverter` body is gone once a map unpacks as a `Hash`
  (`unpacker.c:826-837`), where a Float key needs no unboxing.
- `unpacker.trails.test.ts`'s "reads a whole float32 and float64 as a Float
  wherever it is nested" stays green.
