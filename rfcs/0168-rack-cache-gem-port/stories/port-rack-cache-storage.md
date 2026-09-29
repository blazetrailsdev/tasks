---
title: "Port Rack::Cache::Storage (URI → store resolution)"
status: draft
updated: 2026-09-29
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-disk-stores"]
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

`vendor/rack-cache/v1.17.0/lib/rack/cache/storage.rb` (65 lines). `Storage`
(`:12`) memoizes one store per URI string:

- `initialize` (`:13-16`), `resolve_metastore_uri(uri, options = {})` (`:18-20`),
  `resolve_entitystore_uri` (`:22-24`), and `clear` (`:26-30`, returns `nil`).
- private `create_store(type, uri, options = {})` (`:34-56`). For a string or
  URI it runs `URI.parse`, then `type.const_defined?(uri.scheme.upcase)` →
  `klass = type.const_get(...)`, and passes `options` only when
  `klass.method(:resolve).arity != 1` (`:39-40`). It raises
  `"Unknown storage provider: #{uri}"` (`:42`) otherwise. For a non-URI object it
  sniffs `::Dalli::Client` / `::Memcached` (`:44-55`).
- `@@singleton_instance = new` and `self.instance` (`:60-63`).

Three things have to survive the port:

1. **Scheme lookup is by constant name at call time.** `rails:/` resolves only
   because Rails assigns `MetaStore::RAILS` / `EntityStore::RAILS` after the gem
   loads (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb:33,65`).
   Port `const_defined?` / `const_get` as a lookup of the static member on the
   store class, so a later assignment is visible. Do not build a registry map
   that Rails does not have.
2. **The `arity == 1` arm.** `Heap.resolve(uri, options = {})` takes options.
   `Disk.resolve(uri)`, `MemCacheBase.resolve(uri)`, `Noop.resolve(uri)` and
   Rails' `RailsMetaStore.resolve(uri)` do not. JS `Function.length` does not
   count a defaulted parameter, so Ruby's `method(:resolve).arity` (`-2` for
   `Heap`, `1` for the rest) is **not** `fn.length`. Use the ruby-compat arity
   port if there is one. If there is not, file it instead of approximating.
3. **The `::Dalli::Client` arm (`:44-49`)** accepts a live client object in
   place of a URI. Port it with `port-rack-cache-memcache-stores` if that lands
   first. Otherwise leave the `else` raise in place and let that story add the
   arm. The `::Memcached` arm (`:50-51`) is a non-goal (RFC).

`URI.parse` is `@blazetrails/ruby-compat` `src/uri.ts`.

Tests: `test/storage_test.rb` (119 lines, 15 cases). This story ports 12: the 7
top-level cases (`:9-50`), `Noop Store URIs` (1), `Heap Store URIs` (2) and
`Disk Store URIs` (2). The 3 `MemCache Store URIs` cases (`:95-118`, guarded by
`if have_memcached?`) belong to `port-rack-cache-memcache-stores`. Port to
`packages/rack-cache/src/storage.test.ts`.

## Acceptance criteria

- [ ] `src/storage.ts` ports `Storage` with call-time scheme-constant lookup and
      Ruby's `arity` semantics for the options arm.
- [ ] `storage.test.ts` ports the 12 cases with Rails-identical names.
- [ ] `pnpm parity:api` reports `storage.rb` complete, and the call gates add no
      row.
