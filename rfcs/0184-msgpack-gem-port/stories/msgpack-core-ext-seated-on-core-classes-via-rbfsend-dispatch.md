---
title: "msgpack core_ext: seat to_msgpack on the core class seats and dispatch it through rbFSend"
status: ready
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/msgpack/core_ext.rb` (`vendor/msgpack/v1.8.0/lib/msgpack/core_ext.rb:17-158`)
reopens `NilClass`, `TrueClass`, `FalseClass`, `Float`, `String`, `Array`,
`Hash`, `Symbol` and `Integer` to `include MessagePack::CoreExt`, so
`128.to_msgpack` is an ordinary method call on the receiver.

trails PR 8650 ported it as one class per Ruby class in
`packages/msgpack/src/core-ext.ts`, each carrying `static toMsgpack` and taking
the receiver first (`Integer.toMsgpack(128)`), following
`packages/activesupport/src/core-ext/object/blank.ts`. That is a deviation:
`rbFSend(128, "toMsgpack")` raises `NoMethodError`, because `sendInternal`
(`packages/ruby-compat/src/object.ts`) walks `Object(recv)`'s JS prototype chain
and never the Ruby class seat `rbObjClass(recv)` answers (`rbCInteger`,
`rbCNilClass`, ...). `packages/msgpack/src/symbol.ts` already seats
`toMsgpackExt` on `rbCSymbol.prototype`, which the same gap leaves unreachable
(see `msgpack-symbol-ext-packer-arm-and-extended-object-lookup`).

A naive second walk over `rbObjClass(recv).prototype` is not safe as it stands:
`rbCNumeric.prototype.isInteger` answers `false` and has no `Integer` override,
so `rbFSend(5, "isInteger")` would start answering `false`; and `Hash.prototype`
methods assume a `Hash` instance, not a plain record.

A consequence of the current shape: `toMsgpackWithPacker` is public with
`@internal` where Ruby marks it `private` (`core_ext.rb:20,30,40`), because a
`this`-typed host cannot see a keyworded static (TS2684).

## Acceptance criteria

- `rbFSend` (and `basicObjRespondTo`) dispatch a method a package defines on a
  core class seat (`rbCNilClass`, `rbCTrueClass`, `rbCFalseClass`, `rbCInteger`,
  `rbCFloat`, `rbCString`, `rbCSymbol`) for a receiver of that class, with the
  `isInteger` and plain-`Hash` hazards above handled.
- `core-ext.ts` seats `CoreExt` on those classes with `include`, and
  `to_msgpack_with_packer` on each, so `rbFSend(128, "toMsgpack")` is
  `"\xCC\x80"` and `Packer#write`'s `rbFSend(v, "toMsgpack", this)` arm reaches
  them. The receiver-first statics and the `./core-ext` subpath are removed, or
  kept only as far as callers still need them.
- `Array` and `Hash` are decided explicitly: `rbObjClass([])` is the global
  `Array`, which must not be patched.
- `pnpm parity:api` msgpack stays 100%; ruby-compat extra-surface gate green.
