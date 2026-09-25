---
title: "MessagePack::Serializer#load raises RuntimeError, and the encryption serializer rescues RuntimeError"
status: draft
updated: 2026-09-25
rfc: "0041-activesupport-messagepack-ext"
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

`ActiveSupport::MessagePack::Serializer#load`
(`vendor/rails/activesupport/lib/active_support/message_pack/serializer.rb:22`)
does `raise "Invalid serialization format" unless unpacker.read == SIGNATURE_INT`,
which is a `RuntimeError`. `ActiveRecord::Encryption::MessagePackMessageSerializer#load`
(`vendor/rails/activerecord/lib/active_record/encryption/message_pack_message_serializer.rb:30-31`)
does `rescue RuntimeError` and then `raise Errors::Decryption`.

trails throws `MessagePackError` from `Serializer#load`
(`packages/activesupport/src/message-pack/serializer.ts`), and the encryption
serializer (`packages/activerecord/src/encryption/message-pack-message-serializer.ts:23`)
rescues `e instanceof MessagePackError`. Both the raise and the rescue use a
class Rails does not have. Rails' rescue also catches msgpack's own format errors,
which are `RuntimeError` subclasses (`MessagePack::MalformedFormatError` <
`MessagePack::UnpackError` < `StandardError`... check the gem's hierarchy when
converging).

## Converged shape

- `Serializer#load` raises ruby-compat's `RuntimeError("Invalid serialization format")`.
- `MessagePackError` sits where msgpack's `UnpackError` / `MalformedFormatError` sit in the gem's hierarchy, so a `rescue RuntimeError` port catches exactly what Rails' does.
- The encryption serializer rescues `RuntimeError`, as `message_pack_message_serializer.rb:30` does.

## Acceptance criteria

- [ ] `Serializer#load` raises `RuntimeError` with Rails' message.
- [ ] `MessagePackMessageSerializer#load` rescues `RuntimeError` and raises `Errors::Decryption`.
- [ ] The encryption decryption-failure tests stay green.
