---
title: "port-redis-cache-store-test"
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

`RedisCacheStore` is ported at `packages/activesupport/lib/cache/redis-cache-store.ts` (trails#10394), but
`vendor/rails/v8.0.2/activesupport/test/cache/stores/redis_cache_store_test.rb` is still a `testFile`
row in `scripts/parity/unported-files/activesupport.ts`. Its cases need a live Redis server (the
`behaviors/*` modules over `lookup_store(:redis_cache_store)`), which CI's activesupport lane does not
start. actioncable's redis subscription adapter tests show how a Redis service is provisioned.

## Acceptance criteria

- A Redis service is available to the activesupport test lane.
- `redis_cache_store_test.rb` is ported to `test/cache/stores/redis-cache-store.test.ts` with Rails names.
- The `testFile` row is deleted.
