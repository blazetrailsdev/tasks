---
title: "Port RailsMetaStore / RailsEntityStore (http/rack_cache.rb) over @blazetrails/rack-cache"
status: draft
updated: 2026-09-28
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-rack-cache-storage"]
deps-rfc: []
est-loc: 200
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb` (67
lines) defines `RailsMetaStore < Rack::Cache::MetaStore` (`:12`: `self.resolve`,
`initialize(store = Rails.cache)`, `read`, `write`) and `RailsEntityStore <
Rack::Cache::EntityStore` (`:36`: `self.resolve`, `initialize`, `exist?`,
`open`, `read`, `write`). Each class also seats itself as its base's `RAILS`
scheme constant (`:33`, `:65`), which is how `Rack::Cache::Storage#create_store`
resolves a `rails:/` URI. `pnpm parity:api --package actiondispatch` reports
the file 0/6. `test/dispatch/rack_cache_test.rb` (`RackCacheMetaStoreTest`, 1
test: "stuff is deep duped") has no trails file.

**Scope is the Rails file and its test only.** Vendoring the rack-cache gem
and porting its base classes moved to their own RFC,
`rack-cache-gem-port` (rack-cache 1.17.0, pinned at
`vendor/rails/v8.0.2/Gemfile.lock:434`). This story depends on
`port-rack-cache-storage`, which transitively brings in the vendored source,
`@blazetrails/rack-cache`, `MetaStore` / `EntityStore` with their `Heap`
backends, `EntityStore#slurp` and `Storage`'s call-time scheme-constant lookup.

What the port needs from that package:

- **Overriding the protected hooks from another package.** `RailsMetaStore#read`
  and `#write` override `MetaStore`'s protected abstract pair
  (`rack-cache/v1.17.0/lib/rack/cache/meta_store.rb:172-182`), and
  `RailsEntityStore#write` calls the private `slurp` (`entity_store.rb:14-23`).
  The gem stories record both as `@internal` and reachable from a subclass.
- **Async.** The gem's store methods are async (the `rack-cache-gem-port` RFC,
  "Async from the start"), so these overrides are async too. They `await`
  `@store.read` / `write` / `exist?`, which works whether or not
  `0158-activesupport-assertion-surfaced-port-bugs/cache-store-async-over-npm-clients`
  has made `Rails.cache` async yet.
- **`Marshal`.** `read` / `write` use `Marshal.load` / `Marshal.dump`
  (`:23`, `:30`) as a deep copy, and the one Rails test asserts exactly that.
  The rack-cache RFC's Open question 2 recommends activesupport's cache `coder`
  (`packages/activesupport/src/cache/coder.ts:104`) under the Rails call names.
- **`Rails.cache` default.** `initialize(store = Rails.cache)` reads
  `packages/trailties/src/rails.ts:51` (`static get cache()`) in Rails. That is
  a trailties read from actionpack, so it goes through the `TopLevel.Trails`
  seat (CLAUDE.md § "Call-time constant resolution"), not an import.
- **Optional peer.** rack-cache is Gemfile-only in Rails
  (`vendor/rails/v8.0.2/Gemfile:18`), not an actionpack gemspec dependency, so
  `packages/actionpack/package.json` gains `@blazetrails/rack-cache` as an
  optional peer (`peerDependenciesMeta.optional`) plus a workspace
  devDependency, as `packages/activerecord/package.json` does for `pg`. The
  file is `:enddoc:` and loaded only by `load_rack_cache`, so actionpack's index
  must not import it eagerly. Expose it through a subpath export that
  trailties can `import()`. A new cross-package subpath needs its full set of
  registrations (`package.json` `exports`, the `vitest.config.ts` alias,
  tsconfig paths if any).

## Acceptance criteria

- `packages/actionpack/src/action-dispatch/http/rack-cache.ts` ports both Rails
  classes at their Rails names, seats `MetaStore.RAILS` / `EntityStore.RAILS`,
  and is reachable only through a subpath, not the actionpack index.
- `packages/actionpack/src/action-dispatch/dispatch/rack-cache.test.ts` ports
  "stuff is deep duped", with a `ReadWriteHash` store double like Rails'
  (`rack_cache_test.rb:7-10`).
- `@blazetrails/rack-cache` is an optional peer of actionpack, not a plain
  dependency.
- `pnpm parity:api --package actiondispatch` reports `http/rack_cache.rb` 6/6.
