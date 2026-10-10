---
title: "trailties: await the active_support/message_pack load at boot when a message_pack serializer is configured"
status: done
updated: 2026-10-10
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8736
claim: "2026-10-10T00:08:43Z"
assignee: "message-pack-load-awaited-at-boot-when-a-message-pack-serializer-is-configured"
blocked-by: null
closed-reason: null
---

## Context

Rails' `SerializerWithFallback.[]` requires `active_support/message_pack` in
line when a `message_pack` format is asked for
(`vendor/rails/v8.0.2/activesupport/lib/active_support/messages/serializer_with_fallback.rb:9-15`,
`cache/serializer_with_fallback.rb:9-15`), and `available?` (`:134-140` in
both) makes the same `require` and rescues `LoadError`.

Since trails#8689, trails' `SerializerWithFallback.get` peeks
`ActiveSupport.MessagePack` and raises `LoadError` while it is unseated, and
`isAvailable` answers `false`. The load is
`await ActiveSupport.loadPath["active_support/message_pack"]()`
(`packages/activesupport/src/namespaces.ts`), which no framework entry point
awaits. So a `message_pack` format handed to any of these raises unless the
application imported `@blazetrails/activesupport/message-pack` itself:

- `ActiveSupport::Cache::Store#initialize` / `default_serializer`
  (`activesupport/lib/active_support/cache.rb:304`,
  `packages/activesupport/src/cache/store.ts:158`)
- `ActiveSupport::Messages::Codec#initialize` (`messages/codec.rb:17`,
  `packages/activesupport/src/messages/codec.ts:34`)
- `ActionDispatch::Cookies::SerializedCookieJars#serializer`
  (`actionpack/lib/action_dispatch/middleware/cookies.rb:582`,
  `packages/actionpack/src/action-dispatch/middleware/cookies.ts:749`)

All three are synchronous. The configuration that selects the format is read
during boot, which is async in trails: `active_support.message_serializer`
(`activesupport/lib/active_support/railtie.rb:148-154`), the cache store
options (`railties/lib/rails/application/bootstrap.rb` `initialize_cache`), and
`action_dispatch.cookies_serializer`
(`packages/trailties/src/application.ts:268`).

Both `isAvailable` declarations and both `get` bodies carry
`@missingRailsCall require — CONVERGEABLE <this story>`.

## Acceptance criteria

- A booted trails application configured with a `message_pack` message
  serializer, cache serializer or cookies serializer awaits
  `ActiveSupport.loadPath["active_support/message_pack"]` during boot, before
  any `SerializerWithFallback.get` runs, so none of the three call sites
  raises `LoadError` when `@blazetrails/msgpack` is installed.
- A payload in MessagePack format read by a `json` or `marshal` serializer in a
  booted app is detected (`dumped?`) when the peer is installed, as Rails'
  `available?` makes it.
- With the peer absent, boot surfaces `message_pack.rb:3-10`'s warning and the
  `LoadError`.
- Decide whether the `@missingRailsCall require` receipts can then be dropped
  or become `PERMANENT`, and update them.
