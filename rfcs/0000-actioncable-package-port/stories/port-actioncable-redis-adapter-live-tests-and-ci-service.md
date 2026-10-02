---
title: "Run the Redis adapter's live tests in CI: common suite, channel prefix and reconnections"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable", "scripts"]
deps: ["port-actioncable-redis-adapter"]
deps-rfc: []
est-loc: 400
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rest of `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/redis_test.rb` (152 lines):
`RedisAdapterTest` includes the common suite (8 cases) and
`ChannelPrefixTest` (1) and adds `test_reconnections` (`:19-44`);
`RedisAdapterTest::AlternateConfiguration` (`:69-76`) runs all ten again
with `host` / `port` / `db: 12` in place of `url`.

These need a Redis server. No trails CI lane has one today
(`grep -n redis .github/workflows/ci.yml`). This story adds the service to
the lane that runs `packages/actioncable`, with `REDIS_URL` set, the way
Rails' CI provides it (`redis_test.rb:13`).

`0158/cache-store-async-over-npm-clients` will need the same service for
`RedisCacheStore`. Whichever lands first adds it; the other reuses it.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/redis_test.rb`:
  - [ ] `reconnections` (`:19`)
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/redis_test.rb` also includes the shared suite from `subscription_adapter/common.rb` and `channel_prefix.rb`; every included case runs under this class.

## Fidelity traps (predicted at authoring)

- [ ] **`test_reconnections`** kills pub/sub connections from a second client (`redis_conn.client("kill", "type", "pubsub")`), waits with `pubsub("numsub", channel)` for the adapter to resubscribe, and asserts delivery resumes, twice, the second time on two channels. It is the only test of `retry_connecting?`, `resubscribe` and `reset`.
- [ ] **`wait_pubsub_connection` times out after 5 seconds** with `"Timed out to subscribe to #{channel}"`.
- [ ] **`AlternateConfiguration#cable_config`** deletes `:url` and parses `REDIS_URL` for host and port, defaulting to `127.0.0.1:6379`, with `db: 12`.
- [ ] **`cable_config` has `driver: "ruby"`**, a redis-rb option with no npm counterpart; the connector drops it.
- [ ] **A missing service must fail the lane**, not skip the file.
- [ ] **Changing a lane's `run:` line** can break `scripts/ci-suite-coverage.test.ts`'s fixture literals.

## Acceptance criteria

- [ ] CI runs the actioncable Redis tests against a real Redis: 10 cases in `RedisAdapterTest` and 10 in `AlternateConfiguration`, all credited in `parity:test`; `redis_test.rb` reads complete.
- [ ] Killing the pub/sub connection is followed by a resubscribe and resumed delivery.
- [ ] `scripts/ci-suite-coverage.test.ts` is green.

## Definition of done

A mocked Redis client in place of the service does not close this story.
