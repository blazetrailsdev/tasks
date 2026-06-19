---
title: "Port ActiveSupport CacheKeyTest (expand_cache_key) against real code"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 50
pr: null
claim: "2026-06-19T01:00:08Z"
assignee: "port-activesupport-expand-cache-key"
blocked-by: null
---

## Context

When `cache-key.test.ts` was converged to the canonical AR `CacheKeyTest`
(story `converge-partial-decl-models-updated-at`), the misfiled
`expand cache key` tests were removed: they belong to ActiveSupport's
`CacheKeyTest` (`vendor/rails/activesupport/test/cache/cache_key_test.rb`),
NOT ActiveRecord, and the old versions tested a local re-implementation rather
than real `ActiveSupport::Cache.expand_cache_key`.

Removed test names (port these): `entry_legacy_optional_ivars`,
`expand_cache_key`, `expand_cache_key_with_rails_cache_id`,
`expand_cache_key_with_rails_app_version`,
`expand_cache_key_rails_cache_id_should_win_over_rails_app_version`,
`expand_cache_key_respond_to_cache_key`,
`expand_cache_key_array_with_something_that_responds_to_cache_key`,
`expand_cache_key_of_nil`, `expand_cache_key_of_false`,
`expand_cache_key_of_true`, `expand_cache_key_of_array_like_object`.

## Acceptance criteria

- [ ] Port `activesupport/test/cache/cache_key_test.rb` into the activesupport
      package, exercising the real `ActiveSupport::Cache.expand_cache_key`
      (implement it if missing), not a test-local helper.
- [ ] Test names match Rails verbatim.

## Definition of done

ActiveSupport `expand_cache_key` behavior is covered against real code in the
activesupport package.
