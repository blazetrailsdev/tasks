---
title: "port Cache::Strategy::LocalCache so LocalCacheBehavior's 29 cases can run"
status: claimed
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
blocked-by: null
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
