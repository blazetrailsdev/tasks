---
title: "port Cache::Strategy::LocalCache so LocalCacheBehavior's 29 cases can run"
status: blocked
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-08-13T15:45:44Z"
assignee: "naming-burndown-3-ar-structural-residue"
blocked-by: "Blocked on a store that includes the strategy. Rails' LocalCacheBehavior is included by exactly two test files — vendor/rails/activesupport/test/cache/stores/mem_cache_store_test.rb and redis_cache_store_test.rb — and Strategy::LocalCache is 'prepend'ed by mem_cache_store.rb:42, redis_cache_store.rb:67 and null_store.rb:15 only. MemCacheStore and RedisCacheStore are both unported in trails, and NullStore swallows every write so the 29 behavior cases cannot run against it. The story explicitly forbids inventing a host store, so acceptance criterion 2 is unreachable until one of those two stores is ported. The Strategy::LocalCache port itself also needs a decision on how Ruby's 'prepend' (LocalCache's read_serialized_entry / write_serialized_entry / delete_entry / clear / increment all call super into the store) is spelled in trails — include()/Included<> gives no super chain."
closed-reason: null
---

## Context

`ActiveSupport::Cache::Strategy::LocalCache`
(`activesupport/lib/active_support/cache/strategy/local_cache.rb`) is not
ported. PR #6453 created
`packages/activesupport/src/cache/behaviors/local-cache-behavior.ts` as the
Rails-named helper for `LocalCacheBehavior`
(`activesupport/test/cache/behaviors/local_cache_behavior.rb:4`), but every one
of its 29 cases drives `@cache.with_local_cache` (local_cache_behavior.rb:11),
so all 29 are carried as permanent-skip stubs and
`pnpm parity:test --package activesupport` reports 0 matched for that module.

Related surface that is already ported: `cache/local-cache-middleware.test.ts`
exists (its cases skipped), and `Cache::Store#instrument` already emits the
`store` payload the behavior's first case asserts against the local cache's own
class name.

## Additional evidence (2026-08-17, from PR #6640)

The recorded blocker says NullStore "swallows every write so the 29 behavior
cases cannot run against it". That holds for `LocalCacheBehavior`, but there are
**two** tests outside that module which need only `with_local_cache` against
NullStore and which _expect_ the swallow — so they are reachable without porting
MemCacheStore or RedisCacheStore:

- `test_local_store_strategy`
  (`vendor/rails/activesupport/test/cache/stores/null_store_test.rb:63-71`) — 1
  `assert_equal` + 2 `assert_nil`: inside the block a write is readable and a
  delete nils it, and after the block the write has _not_ survived. The
  post-block `assert_nil` is precisely NullStore's swallow.
- `test_local_store_repeated_reads` (:73-81) — 2 assertions: a repeated `read`
  is nil and a repeated `read_multi` is `{}`.

Rails reaches them because `null_store.rb:15` prepends the strategy, which the
blocker already notes. These two are the only assertion-parity residue left in
`null_store_test.rb` after PR #6640 converged the other ten tests, and they are
tracked from the test side in
`0105-ar-deps-test-parity-100/assertions-activesupport-cluster-tail`.

This does not clear the blocker — acceptance criterion 2 (the 29
`LocalCacheBehavior` cases) still needs a host store, and the `prepend`/`super`
spelling question is untouched. It does mean a narrower slice exists if the
blocker is ever re-triaged: `with_local_cache` + `LocalStore` over NullStore,
without the full behavior suite.

## Converged shape

Port `Strategy::LocalCache` — `with_local_cache`, `middleware`,
`LocalStore`, the `bypass_local_cache` path, and the `read_entry` /
`write_entry` / `delete_entry` / `clear` overrides that keep the local and
remote caches in step — then unskip the behavior helper's cases against a store
that includes it (Rails: MemCacheStore, RedisCacheStore, FileStore via
`ActiveSupport::Cache::Store#new` options).

Because trails' MemCacheStore and RedisCacheStore are themselves unported, the
first including store is likely FileStore or MemoryStore; pick the one Rails
includes the strategy into rather than inventing a host.

## Acceptance criteria

- [ ] `Strategy::LocalCache` is ported at the Rails path with Rails names.
- [ ] `cache/behaviors/local-cache-behavior.ts` runs real cases against an
      including store instead of `it.skip` stubs.
- [ ] `pnpm parity:test --package activesupport` reports matched > 0 for
      `cache/behaviors/local_cache_behavior.rb`.
