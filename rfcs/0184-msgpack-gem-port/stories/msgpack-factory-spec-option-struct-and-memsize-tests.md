---
title: "msgpack: factory_spec.rb's unpacker-option, Struct#to_a and memsize tests"
status: draft
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps:
  - msgpack-packer-unpacker-remaining-c-surface
  - msgpack-symbol-ext-packer-arm-and-extended-object-lookup
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`msgpack-factory-spec-remaining-tests` (trails#8667) took
`vendor/msgpack/v1.8.0/spec/factory_spec.rb` to 33 of 63 tests in
`packages/msgpack/src/factory.test.ts`. Of the 30 left, the 19 that pack a
Symbol are owned by `msgpack-symbol-ext-packer-arm-and-extended-object-lookup`
(its AC ports `factory_spec.rb`'s `register_type(0x00, Symbol)` tests). The
other 11 have no owner; this story is theirs.

Waiting on `msgpack-packer-unpacker-remaining-c-surface`, whose AC names
`packer_spec.rb`, `unpacker_spec.rb` and `cruby/buffer_spec.rb` but not
`factory_spec.rb`:

- `#unpacker` › `creates unpacker with symbolize_keys option`,
  `creates unpacker with allow_unknown_ext option`,
  `creates unpacker without allow_unknown_ext option` (`factory_spec.rb:27-43`).
  `Unpacker`'s constructor (`packages/msgpack/src/unpacker.ts`) reads none of
  `symbolize_keys`, `freeze`, `allow_unknown_ext`, and `MessagePack::ExtensionValue`
  is unported.
- `#dump and #load` › `accept options` (`factory_spec.rb:72-75`).
- `#pool` › `support symbolize_keys: true`, `support freeze: true`
  (`factory_spec.rb:771-779`).
- recursive serialization › `sets the correct length` (`factory_spec.rb:449-481`):
  `allow_unknown_ext` and `ExtensionValue`, and it packs `point.to_h`, whose keys
  are Symbols, so it needs the symbol story too.

Waiting on ruby-compat:

- recursive serialization › `respect message pack format`
  (`factory_spec.rb:428-447`) packs `point.to_a` of a `Struct.new(:x, :y, :z)`.
  ruby-compat's `Struct` (`packages/ruby-compat/src/struct.ts`) has `toH` and no
  `toA` (`rb_struct_to_a`, `vendor/ruby/v3.3.11/struct.c`). It registers
  `Symbol` but packs none.

No JS counterpart:

- `memsize` › `works on a fresh factory`, `works on a factory with registered types`
  (`factory_spec.rb:666-682`) read `ObjectSpace.memsize_of`, which the gem itself
  skips on JRuby.

Not counted: "registering an ext type for a module" (`factory_spec.rb:302-335`)
is three unnamed `it { }` blocks, which `parity:test` does not extract. Its
packing arms are in `packer.trails.test.ts` and its unpacking arm in
`factory.trails.test.ts` (trails#8667).

## Acceptance criteria

- The seven option tests are in `packages/msgpack/src/factory.test.ts` under
  their gem names once `msgpack-packer-unpacker-remaining-c-surface` has merged.
- `Struct#toA` is ported in ruby-compat with its MRI citation and
  `respect message pack format` is ported under its gem name.
- The two `memsize` tests are decided with the maintainer: parked as
  `it.skip` under a `PERMANENT-SKIP:` line, or left unported with the reason.
- `pnpm parity:test` delta non-negative and `pnpm parity:test:assertions` green
  with the msgpack mark unchanged at 0.
