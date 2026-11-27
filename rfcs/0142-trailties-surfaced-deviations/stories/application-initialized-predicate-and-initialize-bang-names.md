---
title: "trailties: initialized? ports as isInitialized, Rails.initialize! as initializeBang"
status: draft
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Rails::Application#initialized?` (`vendor/rails/v8.0.5.2/railties/lib/rails/application.rb`) and `Rails.initialized?` (`railties/lib/rails.rb`, delegated to `application`) are predicates. trails ports them as `initialized()` (`packages/trailties/lib/application.ts:172`, `packages/trailties/lib/trails.ts:148`), a bare name that `parity:api:predicates` (RFC 0156) should read as `isInitialized`. `Rails.initialize!` is likewise ported as `Trails.initialize` (`trails.ts:141`) where the convention is `initializeBang`; `Application#initializeBang` is already correct.

Seen while porting `test_initialize_can_be_called_at_any_time` (`railties/test/application/loading_test.rb:458-466`) in trails#10830.

## Acceptance criteria

- [ ] `Application#initialized` → `isInitialized`, `Trails.initialized` → `isInitialized`, `Trails.initialize` → `initializeBang`, every caller updated.
- [ ] `parity:api:predicates` and `parity:api` clean for those names.
