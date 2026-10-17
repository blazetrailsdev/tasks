---
title: "i18n-backend-cache"
status: draft
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`I18n::Backend::Cache` (`vendor/i18n/<ver>/lib/i18n/backend/cache.rb`) and `I18n.cache_store` / `cache_namespace` / `perform_caching?` are unported in `@blazetrails/i18n` (no `packages/i18n/src/backend/cache.ts`). `actionview/test/template/translation_helper_test.rb` `test_translate_caching_backend` (`vendor/rails/v8.0.2/actionview/test/template/translation_helper_test.rb:392-410`) needs it; it is parked as `it.skip("translate caching backend")` in `packages/actionview/src/template/translation-helper.test.ts`.

## Acceptance criteria

- `packages/i18n/src/backend/cache.ts` ports `I18n::Backend::Cache` (`translate`, `fetch`, `cache_key`) with `I18n.cacheStore` / `cacheNamespace` / `cacheKeyDigest` / `isPerformCaching` accessors.
- The ported `cache_test.rb` passes.
- `translate caching backend` in `translation-helper.test.ts` is un-skipped and passes.
