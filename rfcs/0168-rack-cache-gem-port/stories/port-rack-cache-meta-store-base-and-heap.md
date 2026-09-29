---
title: "Port Rack::Cache::MetaStore with its Heap backend"
status: draft
updated: 2026-09-29
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps:
  [
    "port-rack-cache-response",
    "port-rack-cache-key",
    "port-rack-cache-entity-store-base-heap-and-noop",
  ]
deps-rfc: []
est-loc: 600
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-cache/v1.17.0/lib/rack/cache/meta_store.rb` (443 lines). This story
covers the abstract base, which holds the gem's storage logic, and the Heap
backend. Disk is `port-rack-cache-disk-stores` and Dalli is
`port-rack-cache-memcache-stores`.

**`MetaStore` (`:23`)**, public:

- `lookup(request, entity_store)` (`:28-58`) reads entries for
  `cache_key(request)` and finds the first whose request matches under the
  stored `vary` (`requests_match?`). It opens `x-content-digest` from the entity
  store and restores the response. If the body is gone, it `purge`s the key,
  rescuing `NotImplementedError` into a **once-per-process** `warn` guarded by
  the class variable `@@warned_on_purge` (`:49-55`). That is a module-level flag,
  not a per-instance one.
- `store(request, response, entity_store)` (`:62-109`) writes the body through
  `entity_store.write` (with `response.ttl` when `rack-cache.use_native_ttl` is
  set and the response is fresh). It sets `x-content-digest` and
  `content-length` (unless `Transfer-Encoding`), and re-opens the body from the
  store unless the store is `EntityStore::Noop` (`:77-87`). Then it drops
  non-varying entries, deletes `age`, `unshift`s the new entry, and `write`s.
- `cache_key(request)` (`:112-115`) uses `request.env['rack-cache.cache_key'] || Key`
  and `.call`.
- `invalidate(request, entity_store)` (`:118-131`) calls `expire!` on each fresh
  entry and writes only if something changed.

Private: `persist_request` (`:138-142`, keeps only `/[0-9A-Z_]/` keys whose value
`respond_to?(:to_str)`), `restore_response` (`:146-149`, which `delete`s
`x-status` from the stored hash), `persist_response` (`:151-155`),
`requests_match?` (`:159-165`) and `hexdigest` (`:192-194`). Protected abstract
`read` / `write(key, negotiations, ttl = nil)` / `purge` raise
`NotImplementedError` (`:172-187`), and the "has not implemented" test
(`test/meta_store_test.rb:358-364`) asserts exactly that. Port the raise from
ruby-compat, not a TS `abstract`.

`private` / `protected` here are Ruby visibility. Mark them `@internal` and keep
the TS keyword beside it as the type-checker's view (CLAUDE.md "Method
visibility is a side table"). **Rails' `RailsMetaStore` overrides `read` /
`write` from another package** (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb:21-31`),
so a TS `protected` must still admit that override.

**`Heap` (`:199-229`)**: `initialize(hash={}, options = {})`, `read` (returns
entries with each response hash `dup`ed, `:205-211`), `write`, `purge`,
`to_hash`, and `self.resolve`. Constants `HEAP`, `MEM` (`:231-232`). As with
`EntityStore`, the scheme constants are static members that `Storage` reads by
name and that Rails extends with `RAILS` (`rack_cache.rb:33`).

**Async (RFC "Async from the start").** `lookup` / `store` / `invalidate` and
`read` / `write` / `purge` return promises and await the entity store.

Tests, from `test/meta_store_test.rb` (462 lines): the 33 shared
`RackCacheMetaStoreImplementation` cases (`:5-355`), run as a shared-behaviour
function against Heap, plus "has not implemented" (`:358-364`). That is 34 of the
file's 38. The file's own `before` builds a `mock_request` / `mock_response` /
`slurp` harness (`:11-44`), which belongs in the same test file. Port to
`packages/rack-cache/src/meta-store.test.ts`.

## Acceptance criteria

- [ ] `src/meta-store.ts` ports `MetaStore`, `Heap` and the `HEAP` / `MEM`
      constants, async, with Ruby visibility recorded and the abstract trio
      raising `NotImplementedError`.
- [ ] The purge warning fires once per process, not once per instance.
- [ ] `meta-store.test.ts` ports the 34 cases with Rails-identical names, and the
      shared cases live in a function the Disk and Dalli describes can call.
- [ ] `pnpm parity:api` reports the base and Heap members complete, and the call
      gates add no row.

**Pre-agreed split, if the PR would pass the ceiling.** Split on the shared
module's own section markers, and never split the class:

- **This PR:** `MetaStore` (`meta_store.rb:23-197`) and `Heap` (`:199-232`) in
  full, the `mock_request` / `mock_response` / `slurp` harness
  (`test/meta_store_test.rb:11-44`), "has not implemented" (`:358-364`), and the
  12 "Low-level implementation methods" cases (`:52-123`). Count of record: 13.
- **Follow-up story `port-rack-cache-meta-store-shared-lookup-cases`** (file it
  with `pnpm tasks new`, depending on this one): the 21 cases under "Abstract
  methods", "Vary", "Age" and "TTL" (`:125-355`). `lookup` / `store` /
  `invalidate` land in this PR anyway, because the Heap class needs them.
  `port-rack-cache-disk-stores` must then depend on the follow-up too, so the
  Disk describe re-runs the complete shared module.
