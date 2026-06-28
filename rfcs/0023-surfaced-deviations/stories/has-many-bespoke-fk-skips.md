---
title: "assess 3 skipped has-many tests with non-canonical FK columns (thr_id, hc_author_id, ns_author_id)"
status: ready
updated: 2026-06-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts` has 3 tests skipped because they require bespoke FK columns not present in canonical `posts` or `comments`:

1. **"counter cache on unloaded association"** (`// TODO: non-standard FK thr_id_* not in canonical posts/comments`) — Rails uses `ThrTag`/`ThrPost` with column `thr_id_post_id`.
2. **"get ids for through"** (`// TODO: non-standard FK hc_author_id/hc_post_id not in canonical posts/comments`) — Rails uses `HabtmPost` with `hc_author_id`.
3. **"has many through respects hash conditions"** and **"joins with namespaced model should use correct type"** (`// TODO: non-standard FK ns_author_id not in canonical posts`) — Rails uses `NsPost` with `ns_author_id`.

The canonical `posts` table has only `author_id`, `title`, `body`, `type`, `taggable_id`, `taggable_type`, `tags_count`, `taggings_count`, `taggings_with_delete_all_count`, `taggings_with_destroy_count`, `legacy_comments_count`. None of these bespoke FKs are present.

Rails source: `activerecord/test/cases/associations/has_many_associations_test.rb` (search `thr_id_`, `hc_author_id`, `ns_author_id`).

## Acceptance criteria

- Determine whether each test can be ported using a different canonical model pair (that has the required FK/through setup in canonical schema) or must remain permanently skipped.
- If porteable: un-skip and make green on all three adapters.
- If not: convert `it.skip` to `it.skip(/* BLOCKED: ... */)` with a permanent justification comment and file no further story.
- `pnpm test:compare` delta is non-negative.
