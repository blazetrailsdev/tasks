---
title: "activerecord: MessagePack::Extensions.install registers through the gem's register_type shape"
status: in-progress
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps:
  - msgpack-repoint-activesupport-onto-the-package
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8674
claim: "2026-10-08T12:43:12Z"
assignee: "msgpack-repoint-activesupport-onto-the-package"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::MessagePack` was ported in trails#8589 onto the hand-rolled ActiveSupport codec, so
`Extensions.install` in `packages/activerecord/src/message-pack.ts` registers its two ext types in that
codec's invented shape, not the msgpack gem's:

- Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/message_pack.rb:25-34`) calls
  `registry.register_type 119, ActiveModel::Type::Binary::Data, packer: :to_s, unpacker: :new` and
  `registry.register_type 120, ActiveRecord::Base, packer: method(:write_record), unpacker: method(:read_record), recursive: true`.
- trails passes one object: `{ type, klass: "<class name string>", recursive, match, packer, unpacker }`, with
  `write_record` / `read_record` wrapped in lambdas because `RegisteredType`'s `packer` / `unpacker` are typed
  `(value: unknown, packer)` and `(source: Buffer | Unpacker)`.
- The test (`packages/activerecord/src/message-pack.test.ts`, "enshrines type IDs") therefore compares class-name
  strings, where `vendor/rails/v8.0.2/activerecord/test/cases/message_pack_test.rb:14-27` compares
  `{ 119 => ActiveModel::Type::Binary::Data, 120 => ActiveRecord::Base }` against `registered_types`' `:class`.
- The test's `serializer` helper uses `Factory#dump` / `Factory#load`, added to the hand-rolled
  `packages/activesupport/src/message-pack/factory.ts` in trails#8589; the package's own `dump` / `load` replace them.

This is the activerecord client of the codec that `msgpack-repoint-activesupport-onto-the-package` repoints; that
story predates the activerecord port and does not name `activerecord/src/message-pack.ts`.

## Acceptance criteria

- [ ] `Extensions.install` calls the msgpack package's `registerType(119, BinaryData, { packer, unpacker })` and
      `registerType(120, ActiveRecord.Base, { packer, unpacker, recursive: true })` in the gem's argument order,
      with no `match` predicate and no class-name string.
- [ ] `write_record` / `read_record` are passed as the methods themselves, as `method(:write_record)` is, with no
      wrapping lambda.
- [ ] "enshrines type IDs" compares the registered classes, as `message_pack_test.rb:14-27` does.
- [ ] `message_pack.rb` stays at 100% in `parity:api`; `parity:api:calls` and `parity:api:calls:args` stay green.
