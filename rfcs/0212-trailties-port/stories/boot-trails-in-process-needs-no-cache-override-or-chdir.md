---
title: "bootTrails boots a built app with no cache-store override or chdir"
status: draft
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`buildApp` sets `config.cache_store = :mem_cache_store` as Rails does
(`vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb:144`), but booting the
copied app in the Vitest process raises "Could not find cache store adapter for
mem_cache_store" (`packages/activesupport/src/cache.ts:74`), and the app root resolves
to the cwd rather than the app. So the bootTrails test in
`packages/trailties/src/isolation/test-helpers.trails.test.ts` overrides the store to
`:memory_store` and chdirs into the app. Rails' `boot_rails`
(`railties/test/railties/engine_test.rb:31-33`) does neither.

## Acceptance criteria

- `bootTrails` boots a `buildApp` app in process with no cache-store override.
- The app's root comes from its own `config/application.ts`, with no chdir.
