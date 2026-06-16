---
title: "has_many reads ignore class current_scope"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: relation-scoping
deps: []
deps-rfc: []
est-loc: 70
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b1-relation-scoping (PR #3413). has_many association
reads incorrectly inherit the class-level `current_scope`: inside
`Comment.where("1=0").scoping { ... }`, `post.comments.count` returns 0 instead
of 2. In Rails, association readers build their own scope and ignore
`current_scope` unless a default scope is flagged `all_queries: true`.

Blocks (it.skip in scoping/relation-scoping.test.ts):

- `nested scope finder` (HasManyScopingTest)
- `none scoping` (HasManyScopingTest)

## Acceptance criteria

- has_many collection reads do not merge the class `current_scope`.
- Un-skip the two cases above.
