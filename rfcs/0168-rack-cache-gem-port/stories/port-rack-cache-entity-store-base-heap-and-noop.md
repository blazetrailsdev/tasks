---
title: "Port Rack::Cache::EntityStore with its Heap and Noop backends"
status: draft
updated: 2026-09-28
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["enroll-rack-cache-in-compare-tooling"]
deps-rfc: []
est-loc: 380
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-cache/v1.17.0/lib/rack/cache/entity_store.rb` (371 lines). This
story covers the abstract base and the two I/O-free backends. Disk is
`port-rack-cache-disk-stores` and Dalli is `port-rack-cache-memcache-stores`.

- **`EntityStore` (`:8`).** Private `slurp(body)` (`:14-23`) iterates the Rack
  body, sums `bytesize`, feeds a `Digest::SHA1`, yields each part, closes the
  body if it responds to `close`, and returns `[hexdigest, size]`.
  `bytesize(string)` (`:25-29`) is a feature-detect with two defs. Port the
  `String#bytesize` arm (UTF-8 byte length, not `.length`). `private :slurp,
:bytesize` (`:31`), so both are `@internal`. `slurp` is the one base member
  Rails' `RailsEntityStore#write` calls (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb:60`),
  so it must be reachable from a subclass in another package.
- **`Heap` (`:35-77`)**: `initialize(hash={}, options = {})`, `exist?`, `open`
  (returns `body.dup`), `read` (`body.join`), `write(body, ttl=nil)`, `purge`,
  and `self.resolve(uri, options = {})`. Constants `HEAP = Heap`, `MEM = Heap`
  (`:79-80`).
- **`Noop` (`:341-366`)**: `exist?` is always `true`, `read` is always `''`,
  `open` is always `[]`, `write` slurps and discards, `purge` returns `nil`, and
  there is `self.resolve(uri)`. `NOOP = Noop` (`:368`). `MetaStore#store`
  special-cases it by class (`meta_store.rb:78`, `is_a? EntityStore::Noop`).

**Async (RFC "Async from the start").** `open` / `read` / `write` / `exist?` /
`purge` return promises on the base signature, even where Heap and Noop could
answer synchronously, because `MetaStore` and `Context` await them and the
Dalli backend cannot answer sync. `slurp` iterates a Rack body. Follow the
iteration trails' Rack middleware already uses (`for (const part of body)`,
`packages/rack/src/etag.ts:57`).

`Digest::SHA1` is `packages/ruby-compat/src/digest.ts:91`.

**The scheme constants are how `Storage` resolves a URI.**
`Storage#create_store` does `type.const_get(uri.scheme.upcase)`
(`storage.rb:37-38`), and Rails adds `RAILS` at `rack_cache.rb:65`. They must be
real static members on `EntityStore`, readable by name at call time, so a
subclass in actionpack can seat `RAILS` after the fact.

Tests, from `test/entity_store_test.rb` (340 lines): the 12 shared
`RackCacheEntityStoreImplementation` cases (`:6-89`), run as a shared-behaviour
function against Heap; `Heap` (`:98-111`, 2); and `Noop` (`:277-338`, 9). That is
23 of the file's 30. Port to `packages/rack-cache/src/entity-store.test.ts`. The
shared-behaviour function must be callable from the Disk and Dalli describes the
later stories add.

## Acceptance criteria

- [ ] `src/entity-store.ts` ports `EntityStore`, `Heap`, `Noop` and the `HEAP` /
      `MEM` / `NOOP` constants, async on the base signatures.
- [ ] `slurp` and `bytesize` are `@internal` and reachable from a subclass.
- [ ] `entity-store.test.ts` ports the 23 cases with Rails-identical names, and
      the shared cases live in a function the Disk and Dalli describes can call.
- [ ] `pnpm parity:api` reports the Heap/Noop/base members complete, and the call
      gates add no row.
