---
title: "disable-joins-through-skips-per-reflection-pluck"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/has_many_through_disable_joins_associations_test.rb:36-64`
(counting / pluck on disable joins through, plain and custom foreign key)
asserts `assert_queries_count(2) { @author.no_joins_comments.count }` (and
`.pluck(:id)`): one query for the through ids, one for the target.

trails runs ONE query, `SELECT COUNT(*) FROM "comments" WHERE "comments"."post_id" IN (?, ...)`,
so the intermediate `posts` id query is skipped (the ids appear to come from the already-loaded
`author.posts` target). Rails' chain walk is
`vendor/rails/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:18-30`
(`last_scope_chain` runs `records.pluck(foreign_key)` per reflection);
trails' is `packages/activerecord/src/associations/disable-joins-association-scope.ts`.

`has-many-through-disable-joins-associations.test.ts` carries four `it.skip` tests
(counting / pluck, plain and custom foreign key) pointing at this story.

## Acceptance criteria

- The disable-joins chain walk issues the per-reflection `pluck` query Rails does.
- The four skipped tests are un-skipped and pass.
