---
title: "post.comments.isEmpty() ignores counter cache due to legacy_comments_count alias"
status: done
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4845
claim: "2026-07-13T19:29:37Z"
assignee: "post-comments-counter-cache-column-alias"
blocked-by: null
---

## Context

`Post.hasMany("comments")` in `packages/activerecord/src/test-helpers/models/post.ts` and
`Comment.belongsTo("post", { counterCache: true })` in `packages/activerecord/src/test-helpers/models/comment.ts`.

When `counterCache: true`, trails derives the counter column as `comments_count` (from the inverse
hasMany name). But the canonical posts table uses `legacy_comments_count` (with
`aliasAttribute("commentsCount", "legacy_comments_count")`), not `comments_count`.

As a result, `reflection.hasCachedCounter()` returns `false` for `Post.reflectOnAssociation("comments")`
because `Post.hasAttribute("comments_count")` is false. This means `post.comments.isEmpty()`
falls through to `this.exists()` (a DB query) instead of reading the counter cache, deviating
from Rails' `assert_no_queries { post.comments.empty? }` in `test_calling_empty_with_counter_cache`
(has_many_associations_test.rb:1473).

Surfaced while converging tail bespoke schemas in has-many-associations.test.ts (PR #4221).
The test "calling empty with counter cache" is currently workaround-ported against Car/Engine
(which has a proper `engines_count` column) with a comment explaining the deviation.

Rails source:

- `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:1473`
- `vendor/rails/activerecord/test/models/post.rb` — `has_many :comments`
- `vendor/rails/activerecord/test/fixtures/posts.yml` — `legacy_comments_count: 2`
- `packages/activerecord/src/test-helpers/models/post.ts:188` — `aliasAttribute("commentsCount", "legacy_comments_count")`

## Acceptance criteria

- [ ] `hasCachedCounter?` returns true for `Post.reflectOnAssociation("comments")`
- [ ] `post.comments.isEmpty()` uses the counter cache (no DB query) when `legacy_comments_count > 0`
- [ ] Test "calling empty with counter cache" re-ported against `posts("welcome")` and passes with `assertNoQueries`
- [ ] No regressions in `post.comments` behavior elsewhere
