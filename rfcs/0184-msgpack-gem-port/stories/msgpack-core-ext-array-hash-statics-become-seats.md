---
title: "msgpack: Array/Hash to_msgpack_with_packer are seats, not statics (core_ext.rb:67-85)"
status: done
updated: 2026-10-15
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8930
claim: "2026-10-15T12:26:10Z"
assignee: "message-pack-extensions-constants-seated-in-extensions-file"
blocked-by: null
closed-reason: null
---

## Context

`packages/msgpack/src/core-ext.ts` keeps `export class Array` / `export class Hash`, each with a static `toMsgpackWithPacker(self, packer)`. They port `vendor/msgpack/v1.8.0/lib/msgpack/core_ext.rb:67-85`. Rails defines `to_msgpack_with_packer` as an instance method on the reopened core class. The other seven core classes get it through `rbModDefineMethod`, and trails#8922 taught the TS extractor to credit those seats.

The two statics remain for two reasons:

- `rbObjClass([])` answers the global `Array`, which is not reopened.
- A plain record has no class in its prototype chain.

Their only callers are `pack.test.ts` and `packer.test.ts`.

## Acceptance criteria

- `to_msgpack_with_packer` for Array and Hash is reached through a seat on `rbCArray` / the ruby-compat `Hash` seat (via `rbFSend` dispatch).
- The `Array` / `Hash` statics and the `./core-ext` subpath are dropped.
- The array and hash cases in `pack.test.ts` / `packer.test.ts` call the Rails-shaped API.
- `parity:api` keeps msgpack at 34/34.
