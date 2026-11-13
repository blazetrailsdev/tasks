---
title: "Port SolidCache::Engine's solid_cache.config initializer"
status: draft
updated: 2026-11-13
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cache"]
deps: ["port-solid-cache-entry-model-and-store"]
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

`SolidCache::Engine`'s `solid_cache.config` initializer (`vendor/solid_cache/v1.0.7/lib/solid_cache/engine.rb:12-33`) reads `config/cache.yml` / `config/solid_cache.yml` (overridable by `SOLID_CACHE_CONFIG`), merges `config.solid_cache.{connects_to,size_estimate_samples,encrypt,encryption_context_properties}`, and builds `SolidCache.configuration = Configuration.new(**options)`. `packages/solid-cache/lib/engine.ts` ports `isolate_namespace`, the `app_executor` initializer and the `setup!` `after_initialize`, but its `solid_cache.config` initializer only runs `Record.connects_to`, receipted `@missingRailsCall configuration — CONVERGEABLE port-solid-cache-engine-config-initializer`. The encryption `after_initialize` (`engine.rb:43-49`) is also unported. trails config files are `.ts` modules read by `Application#configFor` (`packages/trailties/lib/application.ts:504`).

## Acceptance criteria

- The `solid_cache.config` initializer builds `SolidCache.configuration` from the app's cache config file and `config.solidCache`, as `engine.rb:12-33`.
- The receipt is removed; the "loads defaults from config/solid_cache.yml" test in `test/unit/solid_cache_test.rb:47-50` ported (with Expiry's `max_age`).
