---
title: "activesupport: SerializerWithFallback loads ActiveSupport::MessagePack at call time, so msgpack is a real optional peer and LoadError is rescued"
status: in-progress
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8689
claim: "2026-10-08T17:50:52Z"
assignee: "message-pack-loaded-at-call-time-so-msgpack-is-an-optional-peer"
blocked-by: null
closed-reason: null
---

## Context

Rails reaches `ActiveSupport::MessagePack` at call time and treats the msgpack
gem as optional:

- `vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack.rb:3-10`
  wraps `require "msgpack"` in `rescue LoadError`, warns, and re-raises.
- `messages/serializer_with_fallback.rb:10-12` requires
  `active_support/message_pack` only when a `message_pack` format is asked for,
  and `:134-140` `available?` memoizes whether that require succeeds.
- `cache/serializer_with_fallback.rb:11` and `:135-140` do the same.

trails imports it statically from activesupport's root graph:
`packages/activesupport/src/messages/serializer-with-fallback.ts` and
`messages/metadata.ts` import `../message-pack.js`, `isAvailable()` there
returns `true` unconditionally, and `message-pack.ts` opens with a plain
`import "@blazetrails/msgpack"`. So although `@blazetrails/msgpack` is declared
an optional peer (trails#8674), importing `@blazetrails/activesupport` without
it fails at link time, and the `rescue LoadError` arm is not ported. That was
an unmet acceptance criterion of
`msgpack-repoint-activesupport-onto-the-package`.

The same two modules convert at the boundary
(`Buffer.from(MessagePack.dump(object)).toString("latin1")`,
`MessagePack.load(Buffer.from(dumped, "latin1"))`) where Rails passes the
binary String straight through (`serializer_with_fallback.rb:121-127`).

The blocker recorded on trails#8674: a reachable rescue needs the
msgpack-touching modules loaded dynamically, which is top-level await, and
top-level await in a package's root graph reds the website IIFE build and the
CJS compare bundles.

## Acceptance criteria

- Nothing in activesupport's root graph imports `message-pack.ts` or
  `@blazetrails/msgpack` statically; importing `@blazetrails/activesupport`
  with the peer absent succeeds (verify with a plain-node import of the built
  `dist/index.js`).
- `MessagePackWithFallback` and the cache serializer read
  `ActiveSupport.MessagePack` at call time, and `available?` answers from
  whether it is loaded, as `serializer_with_fallback.rb:134-140` does.
- `message_pack.rb:3-10`'s warn-and-re-raise is ported where the load happens,
  with Rails' message.
- If the async load cannot be reconciled with the synchronous
  `SerializerWithFallback.[]`, block the story with that as the specific
  blocker rather than restoring the static import.
- Decide whether the latin1 conversions stay; if the serializers can carry
  bytes end to end, remove them.
