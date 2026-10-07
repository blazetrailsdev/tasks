---
title: "msgpack: Factory has_symbol_ext_type, the packer's T_SYMBOL arm, and the extended-object spec"
status: draft
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MessagePack_Factory_register_type_internal`
(`vendor/msgpack/v1.8.0/ext/msgpack/factory_class.c:232-239`) sets
`has_symbol_ext_type` when the ext module is `rb_cSymbol`, and
`optimized_symbol_ext_type` for `optimized_symbols_parsing:`. `Factory_dup`
(`factory_class.c:117`) copies the first, `MessagePack_Factory_packer`
(`:163`) hands it to the packer, and `msgpack_packer_write_symbol_value`
(`ext/msgpack/packer.h:455-462`) routes a Symbol through
`msgpack_packer_write_other_value` when it is set, else writes the Symbol's
name as a `str` (`msgpack_packer_write_symbol_string_value`).

trails PR for `msgpack-bigint-ext-and-oversized-integer` ported
`lib/msgpack/symbol.rb` as `packages/msgpack/src/symbol.ts` (`toMsgpackExt`,
`fromMsgpackExt`, seated on `rbCSymbol`) and the unpacker side works
(`unpacker.registerType(0, rbCSymbol, "fromMsgpackExt")`). The packer side is
not wired, for two reasons found there:

- `rbObjClass(":foo")` (`packages/ruby-compat/src/object.ts`) answers
  `rbCString`: it does not read the `":name"` Symbol convention
  (`packages/ruby-compat/src/symbol.ts` `isSymbol`). So
  `Packer#extRegistryLookup` (`packages/msgpack/src/packer.ts`) can never find
  an entry keyed on `rbCSymbol`, and `rbFSend(":foo", "toMsgpackExt")` walks
  `String.prototype`, not `rbCSymbol.prototype`.
- `Packer#write` has no `T_SYMBOL` arm (`ext/msgpack/packer.c:176-178`): a
  `":foo"` string packs as the 4-byte str `:foo`, where the gem packs `foo`
  (`a3666f6f`).

`packer_spec.rb:473-490` "when it has no ext type but it was extended by a
module which has one" is unported for a related reason: ruby-compat's
`extend(obj, mod)` (`packages/ruby-compat/src/include.ts`) copies the module's
members onto the object and does not create a singleton class, so
`rbClassOf(obj)` has no singleton class whose ancestry holds the module. The
lookup itself is ported and covered through
`include(rbObjSingletonClass(obj), Mod)` in `packer.trails.test.ts`.

## Acceptance criteria

- `Factory#registerTypeInternal` ports the `ext_module == rb_cSymbol` arm
  (`has_symbol_ext_type`, `optimized_symbol_ext_type`), `Factory#dup` copies
  `hasSymbolExtType`, and `Factory#packer` hands it to the packer.
- `Packer#write` has the `T_SYMBOL` arm and `writeSymbolValue` /
  `writeSymbolStringValue` as `packer.h:455-462` has them, with the ext lookup
  finding an entry registered on `rbCSymbol`.
- `factory_spec.rb`'s `register_type(0x00, Symbol)` tests and
  `packer_spec.rb:509-516` "when registering a type for symbols" are ported
  under their gem names.
- `packer_spec.rb:473-490` is ported under its gem name, or blocked on
  ruby-compat's `extend` creating a singleton class, with the reason.
