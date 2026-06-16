---
title: "left_joins cross-model merge preserves left joins + wheres"
status: in-progress
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 120
priority: 21
pr: 3504
claim: "2026-06-16T21:36:55Z"
assignee: "left-joins-cross-model-merge"
blocked-by: null
---

## Context

Surfaced during RFC 0030 story a6-inverse-and-association-tail. The
`merging left joins should be left joins` test in
`packages/activerecord/src/associations/left-outer-join-association.test.ts`
stays `it.skip`. Rails:
`Author.left_joins(:posts).merge(Post.no_comments).count == 5`. The cross-model
merge path in `relation/merger.ts` does not carry the merged WHERE/left-join
across model classes the way `activerecord/lib/active_record/relation/merger.rb`
does.

Rails ref: `vendor/rails/activerecord/test/cases/associations/left_outer_join_association_test.rb:47`.

## Acceptance criteria

- [x] Cross-model `merge` of a relation preserves left-join rows + merged wheres.
- [x] Un-skip `merging left joins should be left joins` using canonical `Author`/`Post` (+ `no_comments` scope) and fixtures; it passes (count 5).
