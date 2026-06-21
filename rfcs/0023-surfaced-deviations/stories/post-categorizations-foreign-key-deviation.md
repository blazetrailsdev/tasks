---
title: "Converge Post#categorizations foreign key (post_id, not category_id)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-06-21T20:22:40Z"
assignee: "post-categorizations-foreign-key-deviation"
blocked-by: null
---

## Context

Rails `vendor/rails/activerecord/test/models/post.rb` declares
`has_many :categorizations` **twice**: line 171 `foreign_key: :category_id`
and line 275 `foreign_key: :post_id`. In Ruby the later definition wins, so the
effective `Post#categorizations` reflection uses `foreign_key: :post_id`
(`categorizations.post_id = posts.id`).

trails `packages/activerecord/src/test-helpers/models/post.ts:290` ports only
the first declaration:
`this.hasMany("categorizations", { foreignKey: "category_id" })`. So
`Post.joins(:categorizations)` emits
`INNER JOIN categorizations ON categorizations.category_id = posts.id`, which is
semantically wrong vs Rails (`post_id`). Surfaced while porting the
`relation_test.rb` cross-model merge-aliasing tests (PR #3823): the tests pass
because both sides of their count comparison use the same (deviating) join, but
the underlying FK is wrong.

## Acceptance criteria

- [ ] `Post.categorizations` uses `foreignKey: "post_id"` (mirroring the winning
      Rails redefinition at post.rb:275), matching `standard_categorizations`
      semantics.
- [ ] Confirm no canonical test depends on the `category_id` FK; update any that
      do to match Rails.
- [ ] `test:compare` non-negative.
