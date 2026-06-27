---
title: "No captureSql test helper: cannot assert toSql() matches executed query"
status: ready
updated: 2026-06-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/relations_test.rb:754` — `test_to_sql_on_eager_join` uses `capture_sql { Post.eager_load(:last_comment).order(...).to_a }.first` to get the actual SQL executed, then asserts it equals `Post.eager_load(:last_comment).order(...).to_sql`.

Trails has no `capture_sql` (or equivalent query-log interceptor) helper. Without it, we cannot assert that `toSql()` matches the query actually sent to the database. The test is skipped in `relations.test.ts` (PR #4215).

Test: `to sql on eager join`

## Acceptance criteria

- A `captureSql(() => ...)` helper (or equivalent) is available in test context
- `Post.eagerLoad("lastComment").order("comments.id DESC").toSql()` equals the captured SQL from loading that relation
- The skipped test in `relations.test.ts` passes
