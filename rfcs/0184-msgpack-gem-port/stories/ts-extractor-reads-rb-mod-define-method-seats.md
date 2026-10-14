---
title: "ts-extractor-reads-rb-mod-define-method-seats"
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

Surfaced landing trails#8796.

`packages/msgpack/src/core-ext.ts` seats `to_msgpack_with_packer` on each core class seat with `rbModDefineMethod(rbCNilClass, "toMsgpackWithPacker", function ...)`, the port of `vendor/msgpack/v1.8.0/lib/msgpack/core_ext.rb:17-126`. `scripts/api-compare/extract-ts-api.ts` reads `defineMethod` only inside a `new Module((mod) => ...)` block (`harvestModuleInstanceMethods`), so a top-level `rbModDefineMethod(Klass, "name", fn)` is invisible to `parity:api`: no method row, no call set, no params.

Measured on that PR: with the receiver-first `Array` / `Hash` classes removed from `core-ext.ts`, msgpack drops from 34/34 to 33/34 (`to_msgpack_with_packer → toMsgpackWithPacker` missing), although seven seats define it. The row is credited today only through `Array.toMsgpackWithPacker` / `Hash.toMsgpackWithPacker`, the two statics kept because `rbObjClass([])` is the global `Array` and a plain record has no class in its prototype chain.

So those two statics cannot be dropped (their only callers are `pack.test.ts` and `packer.test.ts`) without losing the credit, and the seven seat bodies are compared by no call gate.

## Acceptance criteria

- `extract-ts-api.ts` records a top-level `rbModDefineMethod(<Klass>, "<name>", <function>)` as a method of the file, with params and call set, with a test.
- `core_ext.rb`'s `to_msgpack_with_packer` is credited from the seats, and the call gates compare the seat bodies.
- With that in place, decide `Array` and plain-record `Hash` again: drop the statics and the `./core-ext` subpath and port the two test files' array and hash cases, or record why they stay.
