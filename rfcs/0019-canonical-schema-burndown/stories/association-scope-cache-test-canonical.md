---
title: "association-scope-cache.test.ts → canonical (rewrite cache_* onto canonical authors/posts/comments)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the blocked `associations-scope-cache-cluster`.
`associations/association-scope-cache.test.ts` verifies the internal Association
scope-cache memoization (spies on `AssociationScope.scope`) using a
`cache_authors -> cache_posts -> cache_comments` chain with custom FKs
(`cache_author_id`/`cache_post_id`). No dedicated Rails file.

Most convertible of the cluster — the chain maps to canonical
`authors -> posts -> comments`. The real work:

- back the local model classes with canonical tables (`_tableName` = authors /
  posts / comments) and canonical FK columns (`author_id`/`post_id`) instead of
  the `cache_*` synthetic tables; supply NOT NULL `body` on posts/comments.
- keep the models test-local (do NOT add `cachePosts`/`cacheComments`
  associations to the shared canonical `Author`/`Post` classes — that pollutes
  sibling tests). Local subclasses mapped to canonical tables keep the table
  canonical while isolating association wiring.
- `eslint-disable` is not acceptable.

## Acceptance criteria

- [ ] Rides canonical `authors`/`posts`/`comments` tables with no `cache_*`
      tables and no `eslint-disable`.
- [ ] Scope-cache memoization assertions preserved; test names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from the exclude JSON.
