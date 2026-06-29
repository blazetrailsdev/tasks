---
title: "un-skip counter-cache tests in has-many-associations.test.ts using canonical Topic/Reply"
status: claimed
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: null
claim: "2026-06-29T09:02:21Z"
assignee: "has-many-counter-cache-canonical"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts` has 13 counter-cache tests left skipped with `TODO: counter cache: canonical authors has no posts_count (use HmTopic/HmReply)`.

Rails uses `Topic.replies` / `Reply.belongs_to(:topic, counter_cache: true)` which increments `topics.replies_count`. The canonical schema has `topics.replies_count` and `HmReply` already declares `belongsTo("topic", { counterCache: true })`. The bespoke `Author/Post.posts_count` approach was wrong and cannot work with canonical schema.

Skipped tests (all in `has-many-associations.test.ts`):

- "counter cache updates in memory after concat" → `topic.replies << Reply.create(...)` → `topic.replies_count == 1`
- "counter cache updates in memory after create" → `topic.replies.create!(...)`
- "counter cache updates in memory after create with array" → array create form
- "counter cache updates in memory after update with inverse of disabled" → concat existing replies
- "counter cache updates in memory after create with overlapping counter cache columns" → `UserCommentsCount`/`PostCommentsCount` bespoke; skip permanently
- "counter cache updates in memory after update with inverse of enabled" → `Category.categorizations`; needs fixture or create setup
- "deleting updates counter cache without dependent option" → `posts(:welcome).taggings.delete(...)` → fixture-backed
- "calling update on id changes the counter cache" → `topic.replies.first.update(parent_id: nil)`
- "calling update changing ids changes the counter cache" → topic 1 and 3 with replies
- "calling update changing ids of inversed association changes the counter cache"
- "clearing updates counter cache" → `topic.replies.clear`
- "clearing updates counter cache when inverse counter cache is a symbol with dependent destroy" → `Car.first.engines.clear`
- "destroy all on desynced counter cache association" → `Category.categorizations.destroy_all`
- "counter cache on unloaded association" → `Car.create; car.engines.size == 0`
- "updates counter cache when default scope is given"
- "custom named counter cache" → `topic.approved_replies.clear`

## Acceptance criteria

- All counter-cache tests that can run against canonical schema (Topic/Reply, Car/Engine, Category/Categorization, Post/Tagging) are un-skipped and green on all three adapters.
- Tests that require bespoke models not in canonical schema (overlapping counter cache columns) remain skipped with a `// BLOCKED:` comment explaining why.
- `pnpm test:compare` delta for `has_many_associations_test.rb` is non-negative after this change.
