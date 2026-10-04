---
title: "activerecord: SchemaReflection#cache is a bare ||= once cold loads are serialized"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised in review of trails#8491.

Rails' `SchemaReflection#cache`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:106-108`) is

    def cache(pool)
      @cache ||= load_cache(pool) || empty_cache
    end

The port (`packages/activerecord/src/connection-adapters/schema-cache.ts`, `SchemaReflection#cache`) is

    return (this._cache ||= await this.loadCache(pool).then(
      (newCache) => this._cache || newCache || this.emptyCache(),
    ))!;

The `.then` re-reads `_cache` when the load settles. `loadCache` is awaited, so a bare
`this._cache ||= (await this.loadCache(pool)) || this.emptyCache()` reads `_cache` before the await and
writes after it: two concurrent cold callers would each store and return a different `SchemaCache`, and
the synchronous peek (`loadedCache`, CLAUDE.md § "Schema reflection peeks at a warm cache") would read
whichever landed last, leaving the other caller's warmed tables cold. The call carries
`@inventedArm then — CONVERGEABLE` against this story.

Converged shape: `return (this._cache ||= (await this.loadCache(pool)) || this.emptyCache())` with
nothing else, once concurrent cold callers are serialized where Rails serializes them. Candidates: the
pool's monitor around the cold load (CLAUDE.md § "The pool monitor guards only sections that span an
`await`"), or warming the reflection before any caller can race (`loadAllBang` at boot).

## Acceptance criteria

- [ ] `SchemaReflection#cache` is the one `||=` expression with no `.then`, and its `@inventedArm` receipt is deleted.
- [ ] A test starts two concurrent cold `cache(pool)` calls and asserts both return the same `SchemaCache`.
