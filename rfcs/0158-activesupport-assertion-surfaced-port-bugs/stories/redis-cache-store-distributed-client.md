---
title: "redis-cache-store-distributed-client"
status: draft
updated: 2026-11-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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
closed-reason: null
---

## Context

`RedisCacheStore.build_redis` builds a `Redis::Distributed` when given more than one `url:`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/redis_cache_store.rb:96-125`), and
`delete_matched` (`c.nodes`), `pipeline_entries` (`c.node_for(k)` group-by) and `change_counter`
(`c.node_for(key)`) branch on it. ioredis has no client-side consistent-hash ring (its `Cluster` is
server-side Redis Cluster), so trails' `packages/activesupport/lib/cache/redis-cache-store.ts`
`buildRedisDistributedClient` raises `NotImplementedError` (`@inventedArm throw — CONVERGEABLE`), and
the three distributed arms are omitted.

## Acceptance criteria

- Port `Redis::Distributed` (hash ring over several ioredis clients: `add_node`, `node_for`, `nodes`,
  `pipelined` per node) or an equivalent the operator rules on.
- `buildRedisDistributedClient` builds it; `delete_matched`, `pipeline_entries` and `change_counter`
  carry the distributed arms; the `@inventedArm` receipt is removed.
