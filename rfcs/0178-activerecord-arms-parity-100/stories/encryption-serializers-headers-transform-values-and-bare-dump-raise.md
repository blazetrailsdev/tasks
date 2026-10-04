---
title: "activerecord: encryption serializers' headers_to_json is transform_values and dump raises ForbiddenClass bare"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left in the encryption serializers after trails#8493, outside that story's row list:

- `encryption/message-serializer.ts#headersToJson` and
  `encryption/message-pack-message-serializer.ts#headersToHash` each show `+loop` in
  `pnpm parity:api:arms:report --package=activerecord --direction=invented`. Rails is
  `headers.transform_values do |value| … end`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/message_serializer.rb:67-71`,
  `message_pack_message_serializer.rb:46-50`), reached through `Properties`'
  `delegate_missing_to :data` (`properties.rb:19`). The port builds a null-prototype object with
  `headers.each`.
- Both `dump` methods raise `ForbiddenClass` with an invented message
  (`` `Can only serialize Message instances, got ${typeof message}` ``). Rails raises it bare:
  `raise ActiveRecord::Encryption::Errors::ForbiddenClass unless message.is_a?(…Message)`
  (`message_serializer.rb:31-34`, `message_pack_message_serializer.rb:22-25`).
- `MessageSerializer#messageToJson` / `MessagePackMessageSerializer#messageToHash` build the hash
  with `Object.assign(Object.create(null), …)`, where Rails writes a hash literal
  (`message_serializer.rb:60-65`, `message_pack_message_serializer.rb:39-44`).

## Acceptance criteria

- [ ] `headersToJson` / `headersToHash` are `transformValues(headers.toH(), …)` (ruby-compat
      `transformValues` takes a `Map`), and the two `+loop` rows are gone.
- [ ] Both `dump` methods raise `new ForbiddenClass()` with no message.
- [ ] `messageToJson` / `messageToHash` are hash literals, with the dump bytes unchanged
      ("dumps bytes identical to real Rails MessagePack" stays green).
