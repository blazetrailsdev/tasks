---
title: "i18n-api-tests-all-features-and-memoize-key-value"
status: closed
updated: 2026-11-19
rfc: "0245-i18n-test-parity-100"
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
closed-reason: "Memoize half landed: I18nMemoizeBackendWithKeyValueApiTest is in packages/i18n/test/api/memoize.test.ts:44 on origin/main (trails#10379). all_features half is dead: api/all_features_test.rb is a PERMANENT unported-files row (scripts/parity/unported-files/i18n.ts:43) because it includes Backend::Cache and Metadata, both PERMANENT rows (i18n.ts:11,35) and an RFC non-goal."
---

## Context

`vendor/i18n/v1.14.8/test/api/all_features_test.rb:10-57` builds `Backend < Simple` including `Metadata`, `Cache`, `Cascade`, `Fallbacks`, `Pluralization`, `Memoize`, wrapped in `Chain.new(Backend.new, Simple.new)`, with `I18n.cache_store` set to an ActiveSupport memory store. `packages/i18n/lib/backend/` has no `metadata.ts` or `cache.ts` (`vendor/i18n/v1.14.8/lib/i18n/backend/{metadata,cache}.rb`), so `packages/i18n/test/api/all-features.test.ts` cannot be written yet. Also `I18nMemoizeBackendWithKeyValueApiTest` (`memoize_test.rb:35-63`) is not yet in `packages/i18n/test/api/memoize.test.ts`.

## Acceptance criteria

- [ ] `test/api/all-features.test.ts` mirrors `all_features_test.rb` setup, teardown, and includes (after Metadata/Cache are ported, or files those ports as deps).
- [ ] `memoize.test.ts` adds `I18nMemoizeBackendWithKeyValueApiTest` with its include list.
