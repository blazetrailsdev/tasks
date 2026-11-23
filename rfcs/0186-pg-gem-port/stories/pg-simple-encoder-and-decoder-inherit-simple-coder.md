---
title: "pg-simple-encoder-and-decoder-inherit-simple-coder"
status: in-progress
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: "result-and-coders"
packages:
  - "pg"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10664
claim: "2026-11-23T19:32:21Z"
assignee: "pg-coder-dup-and-composite-dimensions"
blocked-by: null
closed-reason: null
---

# pg: SimpleEncoder/SimpleDecoder inherit PG::SimpleCoder

## Context

RFC 0186 reopened 2026-11-23 for 100% scored `pg` parity. `parity:api` inheritance is
21/23. `PG::SimpleEncoder` and `PG::SimpleDecoder` subclass `PG::SimpleCoder`
(`vendor/pg/v1.6.2/ext/pg_coder.c`, `rb_define_class_under(rb_mPG, "SimpleCoder", rb_cPG_Coder)`), but
`packages/pg/lib/simple-encoder.ts:4` and `simple-decoder.ts:4` extend `Coder` directly.

## Acceptance criteria

- Add `SimpleCoder extends Coder` at the gem's path, seated on the `PG` namespace with its class path. `SimpleEncoder` and `SimpleDecoder` extend it.
- Move any surface the C extension defines on `SimpleCoder` from the subclasses onto it.
- `pnpm parity:api --package pg` reports inheritance 23/23 and `parity:api:extra` adds no novel names.
