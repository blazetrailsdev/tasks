---
title: "activesupport: MessagePack::Serializer is a module extended onto ActiveSupport::MessagePack, not an instantiated class"
status: draft
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
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

`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/serializer.rb:7`
is `module Serializer`, and `message_pack.rb:17` is `extend Serializer` on the
`ActiveSupport::MessagePack` module itself. `message_pack/cache_serializer.rb:7-9`
is `module CacheSerializer; include Serializer; extend self`.

trails ports both as classes and instantiates them:
`packages/activesupport/src/message-pack/serializer.ts` is `export class
Serializer`, `cache-serializer.ts` is `class CacheSerializer extends Serializer`,
and `packages/activesupport/src/message-pack.ts` exports
`MessagePack = new Serializer()` and
`MessagePackCacheSerializer = new CacheSerializer()`. `@message_pack_factory`
and `@message_pack_pool` (`serializer.rb:32,49`) are private fields named
`factoryInstance` / `pool`, and `delegate :register_type, to:
:message_pack_factory` (`serializer.rb:40`) is a hand-written forwarder.

trails#8674 moved the codec onto `@blazetrails/msgpack` and left this shape.

## Acceptance criteria

- `Serializer` is a module (`Module` / `include()` / `extend()` from
  `@blazetrails/ruby-compat`), `MessagePack` is a namespace object extended
  with it as `message_pack.rb:17` does, and `CacheSerializer` includes it and
  extends itself as `cache_serializer.rb:7-9` does. No `new Serializer()`.
- The memo ivars keep Rails' names (`@message_pack_factory`,
  `@message_pack_pool`), and `register_type` comes from `delegate`.
- `ActiveSupport.MessagePack` is seated on the `ActiveSupport` namespace
  (`packages/activesupport/src/namespaces.ts`).
- `pnpm parity:api`, `parity:api:calls`, `parity:api:extra --package
activesupport` non-negative; the message-pack, messages and cache
  serializer tests green.
