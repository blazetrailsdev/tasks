---
title: "SolidCache::Store prepends Strategy::LocalCache; run LocalCache and serializer behaviors"
status: draft
updated: 2026-11-13
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cache", "activesupport"]
deps: ["port-solid-cache-entry-model-and-store"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidCache::Store` prepends `ActiveSupport::Cache::Strategy::LocalCache` (`vendor/solid_cache/v1.0.7/lib/solid_cache/store.rb:6`); `Store::Api#write_serialized_entry` / `read_serialized_entries` exist as the LocalCache hooks. trails has no `Strategy::LocalCache` port (`packages/activesupport/lib/cache/`), so `packages/solid-cache/lib/store.ts` does not prepend it and `LocalCacheBehavior` (`packages/activesupport/test/cache/behaviors/local-cache-behavior.ts`) is not run by `packages/solid-cache/test/unit/solid-cache.test.ts`.

Also: `CacheStoreSerializerBehavior`'s "serializer can be specified" fails for SolidCache because the SQLite driver hands back a Node `Buffer` for a binary column, which `toEqual` refuses against a `Uint8Array` (`packages/activemodel/lib/type/binary.ts` `cast` passes it through), so that behavior is not included either.

## Acceptance criteria

- `Store` prepends the `LocalCache` strategy once it exists; `LocalCacheBehavior` and `CacheStoreSerializerBehavior` run against `SolidCache::Store`.
