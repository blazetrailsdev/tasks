---
title: "mem-cache-store-async-over-npm-client"
status: blocked
updated: 2026-10-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: ["cache-store-async-store-and-local-stores"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: "owner decision 2026-10-15: avoid memcached for now"
closed-reason: null
---

## Context

Split from `cache-store-async-over-npm-clients`. Port `MemCacheStore` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/mem_cache_store.rb`) async over an npm memcached client (e.g. `memjs`) declared as an optional peer. Use the same client as the rack-cache-gem-port RFC's `port-rack-cache-memcache-stores`, so trails declares one memcached peer. No empty `TopLevel.Dalli` seat. Register it in `lookupStore` with a `.new` seam, and unpark the mem_cache `CacheStoreSettingTest` cases (`cache_store_setting_test.rb:30-86`).

## Acceptance criteria

- `MemCacheStore` is ported async, and `lookupStore(":mem_cache_store")` builds it.
