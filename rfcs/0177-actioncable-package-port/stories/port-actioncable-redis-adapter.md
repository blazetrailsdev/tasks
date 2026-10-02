---
title: "Port SubscriptionAdapter::Redis over an npm Redis client, with its connector tests"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-inline-async-and-test-adapters"]
deps-rfc: []
est-loc: 550
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/redis.rb` (256 lines, about 170 of code).

- `prepend ChannelPrefix` (`:13`).
- `cattr_accessor :redis_connector`, defaulting to
  `->(config) { ::Redis.new(config.except(:adapter, :channel_prefix)) }`
  (`:18-20`).
- `broadcast` publishes on `redis_connection_for_broadcasts`;
  `subscribe` / `unsubscribe` go to the listener; `shutdown`;
  `redis_connection_for_subscriptions` (`:28-46`).
- Private `listener`, `redis_connection_for_broadcasts`,
  `redis_connection`, `config_options` (`:49-65`).
- `Listener < SubscriberMap` (`:67-253`): `listen(conn)` with its
  `on.subscribe` / `on.message` / `on.unsubscribe` handlers; `shutdown`;
  `add_channel`; `remove_channel`; `invoke_callback`; private
  `ensure_listener_running`, `when_connected`, `retry_connecting?`,
  `resubscribe`, `reset`; and a version switch (`:212-252`) defining
  `ConnectionError`, `SubscribedClient` and `extract_subscribed_client`
  for redis-rb 4 or 5.

**The client (RFC Open question 4).** trails declares one Redis npm client,
as an optional peer. `0158/cache-store-async-over-npm-clients` (ready) names
the candidates (`redis`, `ioredis`) and has not picked. If it or one of its
child stories has landed, use its client. If not, this story picks, records
the choice in that story's Context through a tasks-repo PR, and the cache
store follows. Never a second client, and never an empty `TopLevel.Redis`
seat for the application to fill (trails#8057 was closed for that).

This story ports the lib and the two test classes that need no Redis server:
`ConnectorDefaultID` / `ConnectorCustomID` / `ConnectorWithExcluded`
(one case, three classes) and `SentinelConfigAsHash`, which stub the
client's constructor with `assert_called_with ::Redis, :new`. The cases that
need a live server are in
`port-actioncable-redis-adapter-live-tests-and-ci-service`.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/redis.rb`

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/redis_test.rb`:
  - [ ] `sets connection id for connection` (`:99`, `RedisAdapterTest::ConnectorDefaultID`)
  - [ ] `sets sentinels as array of hashes with keyword arguments` (`:147`, `RedisAdapterTest::SentinelConfigAsHash`)

## Fidelity traps (predicted at authoring)

- [ ] **`redis_connector` is the seam the tests stub.** Keep it a class-level accessor holding a callable, with a `.new`-shaped call inside that `assertCalledWith` can intercept.
- [ ] **`config_options`** is `@server.config.cable.deep_symbolize_keys.merge(id: identifier)`; `SentinelConfigAsHash` asserts nested sentinel hashes come out Symbol-keyed. Apply CLAUDE.md's `symbolize_keys` rule and say which of its three cases this is.
- [ ] **`config.except(:adapter, :channel_prefix)`** before the client sees it; `ConnectorWithExcluded` asserts both are gone and `id` is kept.
- [ ] **Option names differ between redis-rb and the npm client** (`url`, `host`, `port`, `db`, `password`, `id`, `sentinels`, `driver`, `reconnect_attempts`). Map them in the connector, in one place, and keep the hash the tests assert on in Rails' shape.
- [ ] **Two connections.** A subscribed Redis connection cannot publish. `redis_connection_for_broadcasts` and `redis_connection_for_subscriptions` are separate clients, each from `redis_connector`.
- [ ] **The version switch** picks between redis-rb 4's `SubscribedClient` wrapper and redis-rb 5's bare connection. Only one arm has a counterpart over the npm client; port the one that matches its subscribe API and record the other in `SCOPED_SKIP_GROUPS` with the reason, not as a baseline row.
- [ ] **`listen` is one blocking call in Ruby** (`conn.subscribe("_action_cable_internal") do |on| … end`) that returns when the last channel is unsubscribed. Over an event-driven client the three handlers are registered once and the "thread" is the subscribed connection's lifetime; `shutdown` awaits its end where Rails spins on `@thread.alive?`.
- [ ] **The `_action_cable_internal` subscription** exists so there is always one channel; `count == 1` on the first subscribe resets `@reconnect_attempt`, records `@subscribed_client` and flushes `@when_connected`.
- [ ] **`@subscribe_callbacks[chan]`** is a queue per channel: each `on.subscribe` shifts one callback and posts it to the event loop, and the key is deleted when empty. `Hash.new { |h, k| h[k] = [] }` stores on read.
- [ ] **`when_connected`** runs the block now if subscribed, else queues it; `reset` clears the queue and the callbacks on a connection error.
- [ ] **`retry_connecting?`**: `reconnect_attempts` is an Integer (that many immediate retries) or an Array of sleep durations; it sleeps `@reconnect_attempts[@reconnect_attempt - 1]` seconds. The npm client has its own reconnect strategy: turn it off for the subscription connection (Rails wraps `listen` in `conn.without_reconnect`) so the two do not both retry.
- [ ] **`resubscribe` reads `@subscribers.keys` under `@sync`**, the `SubscriberMap`'s own lock.
- [ ] **`@subscription_lock` sections that await** take the monitor (CLAUDE.md § "The pool monitor guards only sections that span an `await`"); `shutdown`'s `return if @thread.nil?` returns from the method.
- [ ] **`invoke_callback` posts to the event loop** with zsuper.

## Acceptance criteria

- [ ] `redis.rb` reads complete in `parity:api`; the unported version arm is in `SCOPED_SKIP_GROUPS` with a reason, and nothing is baselined.
- [ ] One Redis npm client is an optional peer of actioncable, the same one the cache store uses or will use, recorded in both stories.
- [ ] "sets connection id for connection" (in its three classes) and "sets sentinels as array of hashes with keyword arguments" are ported and credited.
- [ ] Resolving another adapter does not import the Redis client.

## Definition of done

A `TopLevel.Redis` seat with nothing behind it, or a second Redis client beside the cache store's, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/subscription-adapter/redis.trails.test.ts packages/actioncable/src/subscription-adapter/redis.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
