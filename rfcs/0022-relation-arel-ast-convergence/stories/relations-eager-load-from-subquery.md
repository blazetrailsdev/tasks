---
title: "eagerLoad/includes relation cannot be used as from() subquery source"
status: ready
updated: 2026-07-05
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/relations_test.rb:252,259` — two tests use an `includes(:post)` relation as a `from()` subquery source or as a `where(id: relation)` subquery:

- `Comment.includes(:post).where("posts.type": "Post").order(:id)` used as `Comment.select("*").from(relation)` and `Comment.select("a.*").from(relation, :a)`
- Same relation used as `Comment.where(id: relation)`

When `includes` resolves to an eager-load JOIN (because the WHERE references `posts`), the resulting SQL cannot straightforwardly be used as a subquery source in `from()`. Trails does not yet support this composition.

Surfaced in `relations.test.ts` (PR #4215); two tests skipped:

- `finding with subquery with eager loading in from`
- `finding with subquery with eager loading in where`

## Acceptance criteria

- `Comment.select("*").from(Comment.includes("post").where({ "posts.type": "Post" }))` returns correct results
- `Comment.where({ id: Comment.includes("post").where({ "posts.type": "Post" }) })` returns correct results
- Both skipped tests in `relations.test.ts` pass on all three adapters
