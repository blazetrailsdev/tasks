---
title: "Author#firstPosts missing Rails where(id: [0,1]) default scope"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3482 (RFC 0019). The canonical `Author` model declares
`this.hasMany("firstPosts")` with no scope
(`packages/activerecord/src/test-helpers/models/author.ts:148`). Rails'
`author.rb` declares it scoped:
`has_many :first_posts, -> { where(id: [0, 1]) }, class_name: "Post", foreign_key: :author_id`.

Because the scope is missing, `author.firstPosts` returns all of the author's
posts instead of only ids 0/1. This blocked a faithful port of the
`collection proxy respects default scope` test
(`has_many_associations_test.rb:2773`), which asserts
`assert_not_predicate authors(:mary).first_posts, :exists?`.

## Acceptance criteria

- [ ] Add the Rails `where(id: [0, 1])` scope to `Author#firstPosts` (and any
      dependent through-assocs like `commentsOnFirstPosts` that rely on it).
- [ ] Verify against `vendor/rails/activerecord/test/models/author.rb`.
- [ ] Confirm no regressions in association tests referencing `firstPosts`/`firstPost`.
