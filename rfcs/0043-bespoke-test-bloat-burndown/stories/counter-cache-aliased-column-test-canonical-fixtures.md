---
title: "Converge bespoke legacy_posts/legacy_comments aliased-counter test to canonical Post/Comment"
status: in-progress
updated: 2026-06-24
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4077
claim: "2026-06-24T18:38:39Z"
assignee: "counter-cache-aliased-column-test-canonical-fixtures"
blocked-by: null
---

## Context

Surfaced during review of PR #4003 (counter-cache-absent-column-skip-vs-raise).

`packages/activerecord/src/counter-cache.test.ts` declares bespoke
`legacy_posts` / `legacy_comments` tables in its local `TEST_SCHEMA` and a
bespoke `LegacyPost` / `LegacyComment` model pair to exercise the
"counter cache updates an aliased column" test (counter-cache.test.ts, the test
asserting `reloaded.legacy_comments_count === 1`).

This is the real Rails scenario — Rails' `Post#comments_count` is an
`alias_attribute` for `legacy_comments_count` and is used as a `belongs_to`
counter cache — but it is reproduced with invented tables/models instead of the
canonical ones. The canonical `Post` model already aliases
`commentsCount` → `legacy_comments_count`
(`packages/activerecord/src/test-helpers/models/post.ts:45`) and canonical
`Comment` already declares `belongsTo("post", { counterCache: true })`
(`comment.ts:34`), so the aliased-counter path can be covered by the canonical
`Comment#post` → `Post` models with the canonical `posts` / `comments` tables
rather than the bespoke `legacy_*` ones.

Note: PR #4003 already removed the _other_ bespoke pair from this file
(`uncounted_blogs` / `uncounted_entries`, the absent-column scenario) because
Rails has no `counter_cache` targeting a genuinely-absent column. This story
covers the remaining bespoke pair, which DOES map to a real Rails scenario and
should be converged to canonical rather than deleted.

## Acceptance criteria

- [ ] Replace the bespoke `LegacyPost` / `LegacyComment` + `legacy_posts` /
      `legacy_comments` aliased-counter test with one using the canonical
      `Post` / `Comment` models (or canonical `posts` / `comments` tables via
      fixtures), asserting the aliased counter column (`legacy_comments_count`)
      still updates through the `commentsCount` alias.
- [ ] Drop `legacy_posts` / `legacy_comments` from the file's local
      `TEST_SCHEMA` once no test references them.
- [ ] If other tests in the file still need `legacy_*`, scope the criterion to
      what is convertible; do not invent new bespoke tables.
- [ ] No regression in counter-cache.test.ts.
