---
title: "msgpack: each constant is seated on MessagePack by its defining module"
status: done
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8650
claim: "2026-10-07T18:16:51Z"
assignee: "msgpack-constants-seated-by-their-defining-module"
blocked-by: null
closed-reason: null
---

## Context

`packages/msgpack/src/index.ts` builds the `MessagePack` namespace object and
seats every constant on it itself (`rbModConstSet(MessagePack, "Packer",
Packer)` and ten more), following `packages/bcrypt/src/index.ts`. In the gem
each constant is bound by the file that defines it:

- `MessagePack::DefaultFactory = MessagePack::Factory.new` and the
  module functions `load` / `unpack` / `pack` / `dump`
  (`vendor/msgpack/v1.8.0/lib/msgpack.rb:19-48`), ported in `msgpack.ts`.
- `MessagePack::Factory` (`lib/msgpack/factory.rb:2`,
  `ext/msgpack/factory_class.c` `rb_define_class_under`), ported in `factory.ts`.
- `Packer`, `Unpacker`, `Buffer` and the `UnpackError` family
  (`ext/msgpack/packer_class.c`, `unpacker_class.c`, `buffer_class.c`), ported
  in `packer.ts`, `unpacker.ts`, `buffer.ts`.
- `MessagePack::VERSION` (`lib/msgpack/version.rb`), ported in `version.ts`.

trails' settled shape (CLAUDE.md, "Call-time constant resolution") is a
zero-import `namespaces.ts` holding the namespace object, with each constant
seated by its defining module, as `arel/src/namespaces.ts` does. `msgpack.ts`
cannot seat `DefaultFactory` today because the object lives in `index.ts`,
which imports `msgpack.ts`.

## Acceptance criteria

- `packages/msgpack/src/namespaces.ts` exports the `MessagePack` object and
  imports nothing at run time.
- Each of `buffer.ts`, `packer.ts`, `unpacker.ts`, `factory.ts`, `version.ts`
  and `msgpack.ts` seats its own constants with `rbModConstSet`; `msgpack.ts`
  also assigns `load` / `unpack` / `pack` / `dump`. `index.ts` holds no seat.
- `MessagePack` is still exported from the package index, and
  `factory.test.ts`'s `MessagePack.DefaultFactory` / `MessagePack.Factory`
  reads are unchanged.
- A plain-node import of each built `dist/*.js` as the entry module succeeds.
