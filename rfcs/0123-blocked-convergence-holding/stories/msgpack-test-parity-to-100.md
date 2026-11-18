---
title: "msgpack: test parity to 100% (blocked specs, String subclass arm)"
status: done
updated: 2026-11-18
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps:
  - msgpack-symbol-ext-packer-arm-and-extended-object-lookup
  - msgpack-unpacker-read-loop-the-engine-hides
deps-rfc: []
est-loc: 300
priority: null
pr: trails#10226
claim: "2026-11-17T06:28:55Z"
assignee: "msgpack-test-parity-to-100"
blocked-by: null
closed-reason: null
---

## Context

After trails#10201, `pnpm parity:test --package msgpack` reads 314/374 (84%),
15/15 files, and 0 assertion-count / assertion-kind mismatches. The remainder
is 60 skipped tests (each `it.skip` carries a `// BLOCKED:` or
`// PERMANENT-SKIP:` line) plus one unported shared-example arm.

**Blocked on `msgpack-symbol-ext-packer-arm-and-extended-object-lookup`**
(`Packer#write`'s `T_SYMBOL` arm, `ext/msgpack/packer.c`
`msgpack_packer_write_value`; owner decision on the `":"`-prefixed String vs
Symbol collision, e.g. `IPAddr("::1")`):

- `format_spec.rb` "symbol to str", "symbol to str with encoding"
- `msgpack_spec.rb` "encodes symbols as strings"

- `packer_spec.rb` "packs symbols in an ext type"
- `factory_spec.rb` "can be used like a standard coder", "is alias as pack and
  unpack", "handles Symbol type with `packer: nil`", both "registering multiple
  ext type for the same class" examples, "packing an object which has been
  extended by the module", the whole "the special treatment of symbols with ext
  type" group (`factory_spec.rb:506-627`), and `#pool` "types can be registered
  before the pool is created"

**Blocked on `msgpack-unpacker-read-loop-the-engine-hides`** (non-String map
keys, `Unpacker#skip`, binary map keys; `ext/msgpack/unpacker.c` `read_primitive`):

- `msgpack_spec.rb` "decodes hashes with mixed keys and values", "decodes hashes
  of hashes"
- `unpacker_spec.rb` "feed and each continue internal state", "feed and each
  empty string", "feed_each continues internal state", "feed_each enumerator",
  "frozen short strings", "frozen long strings", "gc mark" (all use
  `sample_object`'s `{["a","b"]=>["c","d"]}` key, `unpacker_spec.rb:173-175`),
  and both "binary encoding" examples (`unpacker_spec.rb:815-850`)

- `cruby/unpacker_spec.rb` "skip skips objects", "skip raises EOFError", "skip
  raises level stack too deep error", "skip raises invalid byte error"

**Not ported, no blocker:** `packer_spec.rb:490-507` runs "extension subclasses
core type" for `Hash`, `Array` and `String`. Only Hash and Array are ported
(`packages/msgpack/test/packer.test.ts`, `#register_type`). The String arm maps
to a `Uint8Array` subclass. `Packer#write` keys its ext lookup on
`rbClassOf(v) === rbCString`, as C keys on `rb_class_of(v) == rb_cString`.

**Permanent (stay skipped; listed so the denominator is understood):** String
encoding / identity / frozenness (root CLAUDE.md, "Ruby Strings are JS string
primitives"), `ObjectSpace.memsize_of` (`factory_spec.rb:666-682`), the JRuby-only
`Unpacker#execute/data/stream=` API (`jruby/unpacker_spec.rb`), the
`Temporal.Instant` range limit (`timestamp_spec.rb:88,95`), and
`cruby/buffer_spec.rb:576`.

## Acceptance criteria

- Once each blocker lands, the tests it gates are converted from `it.skip` to
  the Rails body, with their `// BLOCKED:` line removed.
- The `String` arm of "extension subclasses core type" is ported for a
  `Uint8Array` subclass. If `rbClassOf` answers `rbCString` for the subclass,
  converge `Packer#write` so the subclass takes `tryWriteWithExtTypeLookup`.

- `pnpm parity:test --package msgpack` reports every non-permanent test
  matched, with 0 assertion-count / assertion-kind mismatches.
