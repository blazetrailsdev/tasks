---
title: "initialize-cache-skips-lookup-store-so-generated-cache-store-is-omitted"
status: claimed
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-09-25T18:51:40Z"
assignee: "initialize-cache-skips-lookup-store-so-generated-cache-store-is-omitted"
blocked-by: null
closed-reason: null
---

## Context

The generated `config/environments/*.ts` now configure the application via
`Trails.application!.configure(function () { this.config.x = ...; })`
(`packages/trailties/src/generators/app-generator.ts`, the three
`config/environments/*.ts` `createFile` calls), but they mirror only the
top-level `Rails::Application::Configuration` settings. The cache-store line is
also left out, because trails' `initialize_cache`
(`packages/trailties/src/application/bootstrap.ts`, `Bootstrap.initializer("initialize_cache")`)
does not call `lookupStore`. Rails does:
`Rails.cache = ActiveSupport::Cache.lookup_store(*config.cache_store)`
(`railties/lib/rails/application/bootstrap.rb:77-88`). A string store such as
`":memory_store"` is stored as the cache itself, and an Array store becomes a
`NullStore`. The default `cacheStore` (`application/configuration.ts`) is
`["file_store", "tmp/cache/"]`. Rails' default is
`[ :file_store, "#{root}/tmp/cache/" ]` (`application/configuration.rb:57`).

## Acceptance criteria

- `initialize_cache` mirrors `bootstrap.rb:77-88`: `lookupStore(...config.cacheStore)`,
  plus the `respond_to?(:middleware)` → `middleware.insertBefore(Rack::Runtime, …)` arm.
- The default `cacheStore` is `":file_store"` plus `${root}/tmp/cache/`, as in Rails.
- The generated development.ts gets `this.config.cacheStore = ":memory_store";`
  (`railties/lib/rails/generators/rails/app/templates/config/environments/development.rb.tt:31`),
  and test.ts gets `this.config.cacheStore = ":null_store";` (`test.rb.tt:21`).
- A test covers each `lookup_store` arm.
