---
title: "Add overlapping-counter-cache canonical models and un-skip the blocked test"
status: claimed
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: null
claim: "2026-06-29T16:45:39Z"
assignee: "overlapping-counter-cache-models-canonical"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts` keeps one
counter-cache test skipped with a `// BLOCKED:` comment (added in PR #4254):

```ts
it.skip("counter cache updates in memory after create with overlapping counter cache columns", ...)
```

Rails `has_many_associations_test.rb:1405` (`test_counter_cache_updates_in_memory_after_create_with_overlapping_counter_cache_columns`)
uses three bespoke models — `UserCommentsCount`, `PostCommentsCount`, and
`CommentOverlappingCounterCache` (`require "models/comment_overlapping_counter_cache"`
at has_many_associations_test.rb:46). A `CommentOverlappingCounterCache` belongs_to
both a `UserCommentsCount` (counter_cache :comments_count) and a `PostCommentsCount`
(counter_cache :comments_count) — the same column name on two different owners — to
prove the in-memory increment lands on the right owner only.

The canonical schema (`test-helpers/test-schema.ts`) already has the backing tables
(`user_comments_counts` line 1618, `post_comments_counts` line 1171, and the
`comments.user_comments_count_id` / `comments.post_comments_count_id` FK columns at
schema.rb:402-403), but the three models are NOT yet ported under
`test-helpers/models/`.

## Acceptance criteria

- Add canonical `UserCommentsCount`, `PostCommentsCount`, and
  `CommentOverlappingCounterCache` models under
  `packages/activerecord/src/test-helpers/models/`, mirroring
  `vendor/rails/activerecord/test/models/comment_overlapping_counter_cache.rb` and the
  `user_comments_count.rb` / `post_comments_count.rb` model files.
- Un-skip `counter cache updates in memory after create with overlapping counter cache columns`
  and make it green on all three adapters, asserting the two `comments_count` columns
  are incremented independently (Rails has_many_associations_test.rb:1405-1419).
- Remove the `// BLOCKED:` comment.
- `pnpm test:compare` delta for `has_many_associations_test.rb` is non-negative.
