---
title: "merge() does not propagate preload/includes across model boundary"
status: ready
updated: 2026-06-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/relations_test.rb:694` — `Comment.joins(:post).merge(Post.preload(:readers).joins(:readers).where(title: "Uhuu"))` should return a comment whose `result_comment.post.readers` is already loaded (no extra queries). Rails propagates the preload through the merge boundary so that associated records of the base model carry their preloaded associations.

Trails does not yet implement cross-model preload propagation through `merge()`. The test in `relations.test.ts` is skipped with `BLOCKED:` comment (PR #4215).

Test: `preloading with associations and merges`

## Acceptance criteria

- `Comment.joins(:post).merge(Post.preload(:readers).joins(:readers).where(...)).first.post.readers` is already loaded
- `Comment.joins(:post).merge(Post.includes(:readers).where(...)).first.post.readers` is already loaded
- The skipped test in `relations.test.ts` passes
