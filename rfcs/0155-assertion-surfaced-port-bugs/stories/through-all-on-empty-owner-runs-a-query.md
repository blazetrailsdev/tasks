---
title: "through-all-on-empty-owner-runs-a-query"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-25T16:51:41Z"
assignee: "generated-environments-omit-namespaced-framework-settings"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/has_many_through_disable_joins_associations_test.rb:84-94`
(empty on disable joins through, plain and custom foreign key) asserts
`assert_queries_count(0) { empty_author.comments.all }` for an author with no posts.

trails runs one query, `SELECT "comments".* FROM "comments" INNER JOIN "posts" ON
"comments"."post_id" = "posts"."id" WHERE "posts"."author_id" = ?`, where Rails' `all` on a
through association of an owner with no through records runs none. Trails side:
`packages/activerecord/src/associations/has-many-through-association.ts` / `association-scope.ts`.

Two `it.skip` tests in `has-many-through-disable-joins-associations.test.ts` point at this story.
Also asserts `assert_queries_count(1)` for the `no_joins_*` arm; check that once the first passes.

## Acceptance criteria

- `comments.all` on an author with no posts issues 0 queries, `no_joins_comments.all` issues 1.
- The two skipped tests are un-skipped and pass.
