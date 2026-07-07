---
title: "merge() does not propagate preload/includes across model boundary"
status: claimed
updated: 2026-07-07
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 37
pr: null
claim: "2026-07-07T15:25:49Z"
assignee: "relations-cross-model-preload-through-merge"
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
