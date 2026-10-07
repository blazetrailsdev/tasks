---
title: "msgpack: port the rest of factory_spec.rb"
status: in-progress
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8667
claim: "2026-10-07T23:41:59Z"
assignee: "msgpack-factory-spec-remaining-tests"
blocked-by: null
closed-reason: null
---

## Context

`msgpack-factory-pool-and-default-factory` landed `packages/msgpack/src/factory.ts`
and `msgpack.ts` with 21 of `vendor/msgpack/v1.8.0/spec/factory_spec.rb`'s 63
tests in `factory.test.ts`. The 800 LOC ceiling cut two groups that need
nothing unported, and the rest wait on sibling stories.

Portable today, cut for size only:

- `#registered_types` (`factory_spec.rb:116-184`): `returns Array`,
  `returns Array of Hash contains :type, :class, :packer, :unpacker`,
  `returns Array of Hash which has nil for unregistered feature`. A selector is
  a bare string (`subject.registeredTypes("packer")`); `be_a(Proc)` is
  `toBeInstanceOf(Function)`.
- `DefaultFactory` › `should be referred by MessagePack.pack and
MessagePack.unpack` (`factory_spec.rb:691-702`). It needs
  `spec/exttypes.rb`'s `DummyTimeStamp1` / `DummyTimeStamp2`. Declare them in
  the test file: a `src/exttypes.ts` is scored by `parity:api` against
  `timestamp.rb` (its `fromMsgpackExt` / `toMsgpackExt` read as misplaced).
  An unpacker proc receives a `Uint8Array`, so `DummyTimeStamp2.deserialize`
  decodes it before `split(",", 2)`.

Waiting on a sibling:

- Symbol registration (`factory_spec.rb:45-58`, `:63-76`, `:80-85`,
  `:270-300`, `:379-481`, `:506-629`, `:751-755`) —
  `msgpack-bigint-ext-and-oversized-integer` ports `symbol.rb` and the
  `has_symbol_ext_type` / `optimized_symbols_parsing` arms of
  `Factory_register_type_internal` (`ext/msgpack/factory_class.c:232-239`),
  which `Factory#registerTypeInternal` does not carry.
- `oversized_integer_extension` (`factory_spec.rb:337-372`,
  `factory_class.c:241-249`) — same story. `Factory#packer` must then copy
  `has_bigint_ext_type` onto the packer (`factory_class.c:162`).
- `symbolize_keys`, `freeze`, `allow_unknown_ext` and `ExtensionValue`
  (`factory_spec.rb:27-43`, `:72-76`, `:449-481`, `:771-779`) —
  `msgpack-packer-unpacker-remaining-c-surface`.
- "registering an ext type for a module" (`factory_spec.rb:302-335`) —
  `msgpack-class-inherited-p-singleton-lookup-and-cut-specs`.

`Factory_freeze` (`factory_class.c:132-150`) also freezes `pkrg.hash` and
eagerly creates the shared packer cache; `Factory#freeze` freezes only the
factory, and `Factory#packer` copies the registry where the gem borrows it.

## Acceptance criteria

- The two portable groups above are in `packages/msgpack/src/factory.test.ts`
  under their gem names.
- Each waiting group is ported once its sibling has merged; a group whose
  sibling is still open is listed in the PR body, not skipped silently.
- `pnpm parity:test` delta non-negative and `pnpm parity:test:assertions`
  green with the msgpack mark unchanged at 0.
