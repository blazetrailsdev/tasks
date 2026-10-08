---
title: "activesupport: MessagePack::Extensions registers its String-payload unpackers by name, as extensions.rb does"
status: closed
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "converged in trails#8674; Regexp#to_s stays a function because a JS RegExp's toString is JS's"
---

## Context

`msgpack-repoint-activesupport-onto-the-package` moved
`packages/activesupport/src/message-pack/extensions.ts` onto
`@blazetrails/msgpack`'s `registerType(type, klass, options)`. Five of the
registrations in `Extensions.install` still pass a function where Rails
(`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/extensions.rb:20-110`)
passes a Symbol or a `Method`:

- type 2 `BigDecimal`, `unpacker: :_load` (`extensions.rb:31-33`)
- type 9 `ActiveSupport::TimeZone`, `unpacker: method(:load_time_zone)` (`:66-68`)
- type 13 `URI::Generic`, `unpacker: URI.method(:parse)` (`:86-88`)
- type 15 `Pathname`, `unpacker: :new` (`:95-97`)
- type 16 `Regexp`, `packer: :to_s, unpacker: :new` (`:99-101`)

The cause is one fact about the package. A non-recursive unpacker proc is
handed the ext payload as a `Uint8Array`
(`packages/msgpack/src/unpacker.ts`, the `extensionCodec.decode` arm), where the
gem hands it a binary `String`
(`vendor/msgpack/v1.8.0/ext/msgpack/unpacker.c`, `msgpack_unpacker_ext_registry_lookup`
and the `rb_proc_call_with_block` that follows). `BigDecimal._load`,
`URI.parse`, `new Pathname(...)`, `TimeZone.find` and `rbRegInitStr` all take a
JS string, so each registration decodes the bytes in a lambda first.

Regexp has a second gap: `Regexp#to_s` is `rbRegToS(re, "onig")` and
`Regexp.new` is `rbRegInitStr`, neither reachable by name through `rbFSend` /
`rbObjMethod` on a JS `RegExp`.

`ActiveRecord::MessagePack::Extensions.install`
(`packages/activerecord/src/message-pack.ts`) already registers type 119 as
`packer: "toString", unpacker: "new"`, because `BinaryData` takes bytes.

## Acceptance criteria

- The five registrations above pass what Rails passes: the method name string,
  or the `Method` (`rbObjMethod(URI, "parse")`, `rbObjMethod(Extensions, "loadTimeZone")`),
  with no decoding lambda in `extensions.ts`.
- Whatever makes that work lives where MRI has it: either the unpacker hands a
  non-recursive proc a value those callees accept, or the callees accept the
  binary String. Decide once, in the package, not per registration.
- `packages/activesupport/src/message-pack/serializer.test.ts` and
  `serializer.trails.test.ts` stay green, bytes unchanged.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
