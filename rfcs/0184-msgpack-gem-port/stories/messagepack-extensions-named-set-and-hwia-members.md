---
title: "MessagePack Extensions: write_set/read_set and write/read_hash_with_indifferent_access as named members"
status: ready
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::MessagePack::Extensions` registers ext types 12 (Set) and 17
(HashWithIndifferentAccess) through four named methods
(`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/extensions.rb:79-82,101-104`):
`write_set` / `read_set` (`:218-224`) and `write_hash_with_indifferent_access` /
`read_hash_with_indifferent_access` (`:238-244`).

trails' `packages/activesupport/src/message-pack/extensions.ts` inlines all four
bodies into the `registerType` calls for types 12 and 17, so `parity:api` reports
`message_pack/extensions.rb` at 33/37 methods (after trails#8637, which added
`writeRange` / `readRange` / `writeIpaddr` / `readIpaddr` as named members). Every
other recursive type in the file dispatches to a named `Extensions.writeX` /
`Extensions.readX` member.

## Acceptance criteria

- [ ] `Extensions.writeSet`, `readSet`, `writeHashWithIndifferentAccess` and
      `readHashWithIndifferentAccess` exist as members, in Rails' order, with
      Rails' parameter names (`set`, `hwia`, `packer`, `unpacker`), and the type
      12 / 17 registrations call them.
- [ ] `write_set` packs `set.to_a`; `write_hash_with_indifferent_access` packs
      `hwia.to_h` (`extensions.rb:219,239`).
- [ ] `parity:api` shows `message_pack/extensions.rb` at 37/37; existing byte
      and roundtrip tests in `serializer.test.ts` stay green.
