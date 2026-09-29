---
title: "Port the Dalli memcache meta and entity stores over an npm memcached client, async"
status: draft
updated: 2026-09-29
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-storage"]
deps-rfc: []
est-loc: 320
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These are the memcache backends. Paths are under `vendor/rack-cache/v1.17.0/lib/rack/cache/`.

- **`MetaStore::MemCacheBase` (`meta_store.rb:295-331`).** `extend Rack::Utils`.
  `self.resolve(uri)` builds `"host:port"` (default port `11211`) and
  `parse_query(uri.query)`. It maps `'true'` / `'false'` to booleans and every
  other value to a **Symbol** (`value.to_sym`), symbolizes the keys, and sets
  `options[:namespace]` from the path. A non-URI argument goes straight to
  `new uri`.
- **`MetaStore::Dalli` (`:334-360`).** `initialize(server="localhost:11211", options={})`
  uses a client passed in (anything that `respond_to?(:stats)`) or builds one.
  `read` is `cache.get(hexdigest(key)) || []`. `write(key, entries, ttl = 0)`
  defaults the TTL to 0, "don't expire". `purge`.
- **`EntityStore::MemCacheBase` (`entity_store.rb:172-206`)**: `open` → `[read(key)]`,
  and the same `resolve`, except that it calls `uri.path.sub` where the
  metastore calls `uri.path.to_s.sub` (`:197` vs `meta_store.rb:323`). Keep
  that difference.
- **`EntityStore::Dalli` (`:209-243`)**: `exist?`, `read` (forces `BINARY`),
  `write(body, ttl=nil)` (slurps into a `StringIO` and returns `[key, size]` only
  if `cache.set` succeeds), and `purge`.
- `MEMCACHE` / `MEMCACHED` (`meta_store.rb:400-406`, `entity_store.rb:285-286`).
  In Ruby this is `defined?(::Memcached) ? MemCached : Dalli`. trails has no
  `::Memcached`, so both constants are `Dalli`. Keep the conditional's shape
  only if something can make the first arm true. Otherwise assign `Dalli` and
  cite the RFC Non-goal at the site.

**The client (RFC Open question 1 and the Backends table).** Wrap a real npm
memcached client, declared as an **optional peer** of `@blazetrails/rack-cache`
with `peerDependenciesMeta.optional`, following `pg` / `mysql2` in
`packages/activerecord/package.json`. The stores are async from this PR, with no
empty `TopLevel.Dalli` seat. trails#8057 was closed for exactly that shape. If
`0158-activesupport-assertion-surfaced-port-bugs/cache-store-async-over-npm-clients`
has already picked a client, use the same one. Otherwise pick `memjs`, the one
that story names, and record the choice in the RFC. The `require 'dalli'` in
`initialize` (`meta_store.rb:340`) becomes a dynamic `import()` of the peer, so
the package loads without it.

`MemCached` (`meta_store.rb:362-398`, `entity_store.rb:245-283`) is a non-goal
(RFC). Its test describes get `PERMANENT-SKIP` stubs.

Tests. The Ruby suite skips each memcache describe unless a server answers at
`ENV['MEMCACHED']` (default `localhost:11211`, `test/test_helper.rb:14,44-64`),
and the TS port guards the same way. CI has no memcached service and this story
does not add one.

- `test/meta_store_test.rb` `Dalli` (from `:413`): shared cases re-run, plus 2
  `options parsing` cases.
- `test/entity_store_test.rb` `Dalli` (from `:222`): the same.
- `test/storage_test.rb` `MemCache Store URIs` (`:95-118`): 3 cases. Ruby guards
  these with `if have_memcached?`, which checks for the `memcached` gem rather
  than Dalli, so they never run under a Dalli-only Ruby install. In trails
  `memcache:` / `memcached:` resolve to `Dalli`, so guard them on a reachable
  server like the Dalli describes.
- `PERMANENT-SKIP` stubs for the `MemCached` describes (`meta_store_test.rb:386`,
  `entity_store_test.rb:195`, 2 `options parsing` cases each) and the
  `need_java` `GAEStore` describes.

Also add the `::Dalli::Client` arm of `Storage#create_store` (`storage.rb:44-49`)
if `port-rack-cache-storage` left it out.

## Acceptance criteria

- [ ] `MemCacheBase` and `Dalli` land in both store files, async, over an npm
      client declared as an optional peer, with no `TopLevel` seat.
- [ ] `MEMCACHE` / `MEMCACHED` resolve to `Dalli`.
- [ ] With a local memcached running, the Dalli describes and the 3 storage
      cases pass. Without one, they skip rather than fail.
- [ ] The `MemCached` and `GAEStore` describes carry `PERMANENT-SKIP` stubs
      citing the RFC Non-goals.
- [ ] `pnpm parity:api` reports the `MemCacheBase` / `Dalli` members complete,
      and the call gates add no row.
