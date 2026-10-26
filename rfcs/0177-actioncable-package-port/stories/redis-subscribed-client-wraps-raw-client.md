---
title: "redis-subscribed-client-wraps-raw-client"
status: closed
updated: 2026-10-26
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: filed for a receipt the call-args gate does not accept; the Redis adapter port was deferred out of trails PR for eager-load-app-channels-in-finisher, so the premise no longer exists."
---

## Context

`Listener#extract_subscribed_client` (redis-rb 4 arm,
`vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/redis.rb:246-248`)
is `SubscribedClient.new(conn._client)`: it wraps redis-rb's raw client, and
`SubscribedClient#send_command` (`:229-241`) calls `@raw_client.write(command)`
and flushes the socket, while the `conn.subscribe` block's `on.subscribe` /
`on.unsubscribe` handlers read the replies.

`packages/actioncable/src/subscription-adapter/redis.ts` ports that arm over
ioredis, which has no `_client` and no per-channel subscribe/unsubscribe
events. So `extractSubscribedClient` passes the ioredis connection itself
(`@missingRailsName _client — CONVERGEABLE` on it), and `sendCommand` awaits
`subscribe` / `unsubscribe` and re-emits each reply as a `subscribe` /
`unsubscribe` event for `listen`'s handlers (`@missingRailsCall write — PERMANENT`).

## Acceptance criteria

- [ ] `extractSubscribedClient` hands `SubscribedClient` the object that plays
      redis-rb's `_client` (the ioredis command/stream layer), named as Rails
      names it, or the receipt is closed `PERMANENT:` by owner ruling.
- [ ] `pnpm parity:api:calls:args` stays green with the receipt removed.
