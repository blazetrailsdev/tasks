---
title: "cache-fragment-name-awaits-nested-relation-keys"
status: in-progress
updated: 2026-10-25
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9313
claim: "2026-10-25T21:18:44Z"
assignee: "cache-fragment-name-awaits-nested-relation-keys"
blocked-by: null
closed-reason: null
---

## Context

`CacheHelper#cache` (`packages/actionview/src/helpers/cache-helper.ts`) awaits a fragment name's `cacheKeyWithVersion` before calling `cacheFragmentName`, because `Relation#cacheKeyWithVersion` (`packages/activerecord/src/relation.ts`, Rails `relation.rb:438-441`) is async and `ActiveSupport::Cache.retrieve_cache_key` (`packages/activesupport/src/cache.ts`, Rails `activesupport/lib/active_support/cache.rb:123-131`) is sync. Rails' `cache` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/cache_helper.rb:176-187`) has no such arm. The arm handles only a name that is itself keyable. A relation nested in an array name (`cache([post, Post.all])`) still expands to `[object Promise]`, because `retrieve_cache_key` recurses into array elements.

## Acceptance criteria

- A relation anywhere in a fragment name, nested arrays included, expands to its resolved `cache_key_with_version`.
- The invented arm in `cache` is removed, so the await happens where Rails reads the key: on the `expand_cache_key` / store-normalize path, or through a settled prewarm-and-peek shape.
- The `@inventedArm` receipts on `cache` are deleted.
