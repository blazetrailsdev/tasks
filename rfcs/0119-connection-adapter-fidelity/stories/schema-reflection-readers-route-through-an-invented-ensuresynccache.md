---
title: "cached?/columns_hash?/size route through an invented ensureSyncCache instead of Rails' three bodies"
status: in-progress
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7639
claim: "2026-09-09T12:48:28Z"
assignee: "mysql2-execute-override-only-shapes-driver-rows"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of #7586 (`make-schema-cache-gzip-callers-async`), which made
`SchemaReflection#cached?`, `#columns_hash?` and `#size` async
(`packages/activerecord/src/connection-adapters/schema-cache.ts:571,584,595`)
because they all reach the same disk load. Making them async did not converge
their shape, and now that they are async it can be done.

Rails has no `ensureSyncCache` and no `loadCacheFromDisk`. It has three separate
bodies:

- `cached?(table_name)`
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb:79-88`)
  inlines its own load: `if @cache.nil?` / `unless
self.class.check_schema_cache_dump_version` / `@cache = load_cache(nil)`, then
  `@cache&.cached?(table_name)`.
- `columns_hash?(pool, table_name)` (`schema_cache.rb:57-59`) is
  `cache(pool).columns_hash?(pool, table_name)`.
- `size(pool)` (`schema_cache.rb:69-71`) is `cache(pool).size`.

trails routes all three through one invented private helper, `ensureSyncCache`,
which delegates to a second invented helper, `loadCacheFromDisk` — a
decomposition Rails does not have, and one that gives `columns_hash?` and `size`
`cached?`'s version-check-gated load instead of Rails' `cache(pool)` (which
falls back to `empty_cache` and can populate from the pool). The result is that
`size` answers 0 and `columns_hash?` answers false where Rails would have loaded
or built a cache.

This is distinct from `retire-schema-cache-sync-readers-after-checkout-flip`
(RFC 0073), which is about the `getCached*` / `setColumns` /
`eagerLoadSchemaCache` sync shims — not about these three reflection readers or
the two helpers under them.

## Converged shape

Delete both helpers. Inline the `@cache.nil?` load into `cached?` exactly as
`schema_cache.rb:79-88` writes it, and give `columns_hash?` and `size` the
`(await this.cache(pool))` body their Rails counterparts have. `cache(pool)` and
`loadCache(pool)` already exist and are already async.

Note the behaviour change this converges is real, not cosmetic: `size(pool)` and
`isColumnsHash(pool, name)` start going through `cache(pool)`, so they can build
an empty cache and can reflect against the pool. Check the callers — the
`BoundSchemaReflection` wrappers at `schema-cache.ts:714,742,754` and the
`connection-pool.trails.test.ts` expectations that pass a null pool — before
flipping.

## Acceptance criteria

- [ ] `ensureSyncCache` and `loadCacheFromDisk` are gone from
      `connection-adapters/schema-cache.ts`.
- [ ] `cached?` inlines the load exactly as `schema_cache.rb:79-88` does.
- [ ] `columns_hash?` and `size` are `cache(pool)`-based, per
      `schema_cache.rb:57-59,69-71`.
- [ ] `schema-cache.test.ts` and `connection-pool.trails.test.ts` keep their
      names and pass; any expectation that depended on the null-pool shortcut is
      corrected against Rails' behaviour, not around it.
