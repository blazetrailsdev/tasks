---
title: "Skip counter-cache update when the counter column does not exist (Rails has_cached_counter?)"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3983
claim: "2026-06-23T12:07:41Z"
assignee: "counter-cache-skip-when-column-absent"
blocked-by: null
---

## Context

Surfaced while implementing PR #3960. trails' counter-cache update path
(`updateCounterCaches` in `packages/activerecord/src/associations.ts`, via
`incrementBang`/`increment` → `writeAttribute`) writes the counter column even
when that column does not exist on the owner's table. Example: the canonical
`Comment` model declares `belongsTo("post", { counterCache: true })`
(`test-helpers/models/comment.ts:34`), which resolves to `comments_count`, but
the canonical `posts` table has only `legacy_comments_count` (no `comments_count`
— matches Rails schema.rb:977). Rails guards this with `has_cached_counter?`
(`belongs_to_association.rb`), which is `options[:counter_cache] &&
owner_class.has_attribute?(counter_cache_column)` — when the column is absent the
counter cache is silently skipped (no in-memory write, no SQL UPDATE).

trails has no such existence guard: pre-#3960 the missing-column write silently
materialized a phantom attribute (lenient `writeFromUser`); #3960 keeps it
working only by allow-listing registered counter-cache columns in the strict
write guard. The faithful fix is to skip the counter-cache increment entirely
when the counter column is not a real column on the owner, mirroring
`has_cached_counter?`.

Relevant Rails: `activerecord/lib/active_record/associations/builder/belongs_to.rb`
(`has_cached_counter?`), `counter_cache.rb`.

## Acceptance criteria

- [x] `updateCounterCaches` skips the increment/decrement when the resolved
      counter column is not a real column on the owner (Rails `has_cached_counter?`).
- [x] The `_counterCacheColumns` allow-list entry in `ensureWritableAttribute`
      (`readonly-attributes.ts`) can then be dropped (no phantom counter writes).
- [x] No regression to models whose counter column DOES exist
      (e.g. `tags_count`, `legacy_comments_count`).
