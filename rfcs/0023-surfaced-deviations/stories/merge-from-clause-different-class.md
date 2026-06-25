---
title: "merge-from-clause-different-class"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Comment.joins("post").merge(Post.from("posts"))` should run (Rails asserts
`.first` is truthy). In trails the merged query still references the `comments`
table under the swapped FROM clause → `no such table: comments`. The from-clause
merge across different model classes needs to mirror Rails so the base table is
taken from the other relation's `from`.

Surfaced by the faithful port of `relation/merging_test.rb`
(`test_merging_with_from_clause_on_different_class`), `it.skip` in
packages/activerecord/src/relation/merging.test.ts with this slug.

Impl: packages/activerecord/src/relation/merger.ts (mergeClauses /
isReplaceFromClause) + relation SQL build. Rails ref:
vendor/rails/activerecord/lib/active_record/relation/merger.rb.

## Acceptance criteria

- [ ] Un-skip "merging with from clause on different class"; it passes.
- [ ] No regression in "merging with from clause".
