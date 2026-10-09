---
title: "activerecord: SchemaReflection#cache runs under a synchronize Rails does not have"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8729. Rails' `SchemaReflection#cache`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:106-108`) is

    def cache(pool)
      @cache ||= load_cache(pool) || empty_cache
    end

with no lock. The port (`packages/activerecord/src/connection-adapters/schema-cache.ts`, `SchemaReflection#cache`)
runs the same `||=` inside ruby-compat's `synchronize`, keyed on the reflection, because `loadCache` is awaited:
a bare `||=` reads `_cache` before the await and writes after it, so two concurrent cold callers would each
store and return a different `SchemaCache`, and the synchronous peek (`loadedCache`) would read whichever landed
last. The `synchronize` call is one Rails does not make. `pnpm parity:api:arms:throws` does not file it, and a
`@inventedArm synchronize` receipt on it reads as stale, so the call carries no tag today.

`schema-cache.trails.test.ts` ("two concurrent cold cache calls answer the same SchemaCache") pins the behaviour.

## Acceptance criteria

- [ ] `SchemaReflection#cache` is `return (this._cache ||= (await this.loadCache(pool)) || this.emptyCache())`
      with no `synchronize` around it, with cold callers kept from racing somewhere Rails' shape allows
      (for example the reflection is always warmed before a pool is handed out), or the limit is ruled
      permanent by the repo owner and recorded in `packages/activerecord/CLAUDE.md`.
- [ ] The concurrent cold-call test still passes.
