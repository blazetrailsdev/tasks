---
title: "msgpack: IO-backed buffers, unpacker options and the remaining Packer/Unpacker C surface"
status: draft
updated: 2026-10-06
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`msgpack-package-and-vendor-source` ported `MessagePack::Packer` and
`MessagePack::Unpacker` over `@msgpack/msgpack` far enough for
`ActiveSupport::MessagePack` to stand on, and left the rest of the C surface
out. Each item below is a body or arm the gem has and
`packages/msgpack/src/` does not.

**IO-backed buffers.** `MessagePack::Packer.new(io)` / `Unpacker.new(io)`
(`vendor/msgpack/v1.8.0/ext/msgpack/packer_class.c:81`,
`unpacker_class.c:95-153`, `buffer_class.c`'s `MessagePack_Buffer_set_options`)
write through to and read from an IO. `Buffer` stores `io` and never touches it:
`Packer#fullPack` always returns the bytes where `Packer_full_pack`
(`packer_class.c:377-395`) flushes and returns `nil` when an IO is set, and
`Unpacker#read` never pulls from the IO on EOF. `Factory#load`'s non-String arm
(`lib/msgpack/factory.rb:153-155`) reaches this.

**Unpacker options.** `symbolize_keys`, `freeze`, `allow_unknown_ext` and
`key_cache` (`unpacker_class.c:130-150`) are accepted and ignored.
`allow_unknown_ext` needs `MessagePack::ExtensionValue`
(`ext/msgpack/extension_value_class.c`), which is unported; without it an
unregistered ext type always raises `UnknownExtTypeError`, which is the gem's
default.

**Map keys.** The engine decodes a map to a plain object and raises its
`DecodeError` for a key that is not a String or a number, which surfaces as a
bare `UnpackError`. The gem returns a `Hash` with any key
(`spec/unpacker_spec.rb` `sample_object` uses an Array key).

**`StackError` is never raised.** `MessagePack::StackError` is defined, but the
gem raises it past `MSGPACK_UNPACKER_STACK_CAPACITY` (128) nested containers
(`ext/msgpack/unpacker.c`) and the engine's decoder has no depth limit.

**`Unpacker#read` reads a private engine field.** It takes the byte count the
engine consumed from `Decoder#pos`, which `@msgpack/msgpack` declares `private`.
There is no public way to learn it short of decoding twice.

**Symbols.** `msgpack_packer_write_symbol_value`
(`ext/msgpack/packer.h:455-462`) has no port: a trails Symbol is a JS string and
packs as one. `msgpack-bigint-ext-and-oversized-integer` ports `symbol.rb`; the
`has_symbol_ext_type` / `optimized_symbols_parsing` arms of
`Factory_register_type_internal` (`factory_class.c:232-239`) belong with it.

**Unported public methods.** `Packer`: `write_nil` / `write_true` /
`write_false` / `write_float` / `write_string` / `write_bin` / `write_array` /
`write_hash` / `write_symbol` / `write_int` / `write_extension` /
`write_bin_header` / `write_float32`, `flush`, `size`, `empty?`, `write_to`,
`to_a`, `pack` (`packer_class.c:405-441`). `Unpacker`: `each`, `feed_each`,
`skip`, `skip_nil`, `read_array_header`, `read_map_header`, `unpack`
(`unpacker_class.c:420-450`), the last two being what raises
`UnexpectedTypeError`. `Buffer`: `read`, `read_all`, `<<`, `empty?`, `to_a`,
`flush`, `close`, `write_to` (`buffer_class.c`).

## Acceptance criteria

- Each item above is either ported with its spec from
  `vendor/msgpack/v1.8.0/spec/` (`packer_spec.rb`, `unpacker_spec.rb`,
  `cruby/buffer_spec.rb`), or split into its own story with the specific reason.
- The `Decoder#pos` read is replaced by a public mechanism, or blocked with the
  upstream issue that would provide one.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
