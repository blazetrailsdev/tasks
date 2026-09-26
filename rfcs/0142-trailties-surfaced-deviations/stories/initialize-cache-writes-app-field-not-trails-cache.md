---
title: "initialize_cache writes an app-local cache field instead of Trails.cache (bootstrap.rb:81-82)"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `initialize_cache` assigns the global: `Rails.cache = ActiveSupport::Cache.lookup_store(*config.cache_store)`,
guarded by `unless Rails.cache` (`vendor/rails/railties/lib/rails/application/bootstrap.rb:81-82`).
`Rails.cache` is a module accessor (`vendor/rails/railties/lib/rails.rb:44`,
`attr_accessor :app_class, :cache, :logger`), and framework code reads it through that accessor.

trails' `initialize_cache` (`packages/trailties/src/application/bootstrap.ts`, converged onto
`lookupStore` by trails#8101) reads and writes `this.cache`, a field on the Application
(`BootstrapHost.cache`, `packages/trailties/src/application.ts`). `Trails.cache`
(`packages/trailties/src/rails.ts`, `static get/set cache`) exists but boot never assigns it,
so it stays `null` in a booted app. `initialize_logger` has the same shape for `Rails.logger`
(`bootstrap.rb:36-66` writes `Rails.logger`, and trails writes `this.logger`).

## Converged shape

`initialize_cache` guards on `Trails.cache` and assigns `Trails.cache = lookupStore(this.config.cacheStore)`,
as `bootstrap.rb:81-82` does. It reaches `Trails` through the `TopLevel.Trails` seat (CLAUDE.md
§ "Call-time constant resolution") if a plain import closes a cycle. The Application-level
`cache` field goes away, or becomes a reader delegating to `Trails.cache`.

## Acceptance criteria

- After `app.initialize()`, `Trails.cache` is the looked-up store.
- A preset `Trails.cache` is kept, following the `unless Rails.cache` guard.
- There is no second, app-local cache seat that differs from `Trails.cache`.
