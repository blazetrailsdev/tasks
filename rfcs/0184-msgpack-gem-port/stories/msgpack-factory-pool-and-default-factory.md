---
title: "msgpack: Factory, Factory::Pool and DefaultFactory on the package"
status: done
updated: 2026-10-06
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 650
priority: 0
pr: trails#8598
claim: "2026-10-06T20:50:58Z"
assignee: "msgpack-factory-pool-and-default-factory"
blocked-by: null
closed-reason: null
---

## Context

`msgpack-package-and-vendor-source` (trails PR 8591) created
`packages/msgpack` with `buffer.ts`, `packer.ts`, `unpacker.ts`, `version.ts` and
the gem's error classes, and stopped there: the whole package measured ~1,345 LOC
against an 800 LOC ceiling, so `Factory` was split out at the seam where nothing
below depends on it.

What is left is `vendor/msgpack/v1.8.0/lib/msgpack/factory.rb` and
`vendor/msgpack/v1.8.0/lib/msgpack.rb`:

- `Factory#register_type` (`factory.rb:5-38`), `#registered_types` (`:41-84`),
  `#type_registered?` (`:86-97`), `#load` / `#unpack` (`:99-111`), `#dump` /
  `#pack` (`:113-118`), `#pool` (`:120-126`), `Factory::Pool` (`:128-209`) and
  its `MemberPool` (`:130-155`, the `RUBY_ENGINE == "ruby"` arm).
- The C half in `vendor/msgpack/v1.8.0/ext/msgpack/factory_class.c`:
  `Factory_dup` (`:117-130`), `Factory_freeze` (`:132-150`),
  `MessagePack_Factory_packer` (`:152-166`), `MessagePack_Factory_unpacker`
  (`:168-180`), `Factory_registered_types_internal` (`:182-200`),
  `Factory_register_type_internal` (`:202-258`).
- `MessagePack::DefaultFactory`, `MessagePack.load` / `.unpack`, `.pack` /
  `.dump` (`lib/msgpack.rb:19-48`).

What the package already gives a Factory to stand on:

- `Packer#extRegistry` is a `Map<klass, [type, proc, flags]>` and
  `Unpacker#extRegistry` a `Map<type, [klass, proc, flags]>`, both `@internal`
  and public so `Factory#packer` / `#unpacker` can copy the factory's two
  registries in, as `msgpack_packer_ext_registry_borrow` does.
- `MSGPACK_EXT_RECURSIVE` is exported from `packer.ts`; a registry row carrying
  it already packs through `proc(v, packer)` and unpacks through
  `proc(unpacker)`. `packer.trails.test.ts` pins the bytes against the gem.
- A frozen `Packer` / `Unpacker` (`Object.freeze`) still writes and reads, and
  `registerType` on one raises the gem's `FrozenError`, which is what
  `Pool#initialize`'s `factory.packer(options).freeze` needs.
- `MemberPool#with` is `begin; yield member; ensure … end`: port it with
  `rbEnsure` so the member returns to the pool when an async block settles.

A complete, passing draft of `factory.ts`, `msgpack.ts` and a 30-test
`factory.test.ts` was written against that surface in the splitting session and not kept, so
the size is measured, not guessed: about 330 LOC of source and 300 of tests.

## Acceptance criteria

- `packages/msgpack/src/factory.ts` mirrors `lib/msgpack/factory.rb`: `Factory`
  with `registerType`, `registeredTypes`, `isTypeRegistered`, `load` / `unpack`,
  `dump` / `pack`, `pool`, plus the C methods `dup`, `freeze`, `packer`,
  `unpacker`; `Factory.Pool` and `Pool.MemberPool` seated with `rbModConstSet`.
- `register_type`'s default options are `{ packer: "toMsgpackExt", unpacker:
"fromMsgpackExt" }`; a String names a method (`packer.to_sym.to_proc`,
  `klass.method(unpacker).to_proc`), a function is used as is, anything else
  raises `TypeError` with the gem's message.
- `packages/msgpack/src/msgpack.ts` mirrors `lib/msgpack.rb`
  (`DefaultFactory`, `load` / `unpack`, `pack` / `dump`), and the `msgpack`
  entry in `vendor/sources.ts` gains `libEntryFile: "lib/msgpack.rb"` (which
  also means adding `msgpack` to the `libEntryFilesManifest` expectation in
  `vendor/sources.test.ts`).
- `index.ts` exports a `MessagePack` namespace object with each class seated on
  it, shaped like `packages/bcrypt/src/index.ts` minus the `TopLevel` seat (the
  package is a leaf and must not import activesupport).
- `spec/factory_spec.rb` is ported as `factory.test.ts` for every test that does
  not need Symbol, `symbolize_keys` or `ExtensionValue`; `pnpm parity:test`
  delta non-negative.
- If source plus tests exceed the LOC ceiling, land `factory.ts` + `msgpack.ts`
  with the `#pool` and `#register_type` specs first and file the rest.
