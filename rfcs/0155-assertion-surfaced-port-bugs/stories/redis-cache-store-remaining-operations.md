---
title: "redis-cache-store-remaining-operations"
status: draft
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
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

`cache-lookup-store-has-no-mem-cache-or-redis-store` ported
`ActiveSupport::Cache::MemCacheStore` in full
(`packages/activesupport/src/cache/mem-cache-store.ts`, 17/17 on parity:api)
and `RedisCacheStore`'s construction layer plus the three entry hooks `Store`
declares abstract (`packages/activesupport/src/cache/redis-cache-store.ts`):
`build_redis`, `build_redis_distributed_client`, `build_redis_client`,
`initialize`, `inspect`, `read_entry`, `read_serialized_entry`, `write_entry`,
`write_serialized_entry`, `delete_entry`, `deserialize_entry`,
`serialize_entry`, `failsafe`. The Redis, `Redis::Distributed` and
ConnectionPool gems are read off `TopLevel` (`activesupport/src/namespaces.ts`).

Still unported from `vendor/rails/activesupport/lib/active_support/cache/redis_cache_store.rb`:

- `read_multi` (:171-183), `delete_matched` (:201-221), `increment` (:239-248),
  `decrement` (:265-274), `cleanup` (:279-281), `clear` (:286-294), `stats` (:297-299)
- private: `pipeline_entries` (:302-312), `read_multi_entries` (:325-346),
  `delete_multi_entries` (:391-395), `write_multi_entries` (:398-410),
  `normalize_key` (:413-415), `truncate_key` (:417-425), `serialize_entries`
  (:443-447), `change_counter` (:449-474), `supports_expire_nx?` (:476-481)

`normalize_key` / `truncate_key` operate on `super&.b` (a binary String) and
`byteslice`; decide the binary-string spelling before porting them, since
`Digest.hexdigest` of a JS string re-encodes as UTF-8.

The Rails store suites `cache/stores/mem_cache_store_test.rb` and
`cache/stores/redis_cache_store_test.rb` stay excluded as `testFile` entries in
`scripts/parity/unported-files/activesupport.ts`; they need a live memcached /
Redis (or a Dalli / redis-rb double) and the local-cache strategy
(`cache/strategy/local_cache.rb`, also unported, which both stores `prepend`).

## Acceptance criteria

- The methods above are ported into `redis-cache-store.ts` with Rails names,
  control flow and failsafe arms; parity:api for `cache/redis_cache_store.rb`
  reaches 100%.
- The `testFile` exclusions for the two store suites are removed once their
  tests can run against doubles, or re-justified per test.
