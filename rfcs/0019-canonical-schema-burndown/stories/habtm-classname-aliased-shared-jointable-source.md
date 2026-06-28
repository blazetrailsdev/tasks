---
title: "habtm-classname-aliased-shared-jointable-source"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps:
  - assoc-eager-split-canonical-preloading
deps-rfc: []
est-loc: null
priority: 93
pr: 4227
claim: "2026-06-27T19:46:35Z"
assignee: "habtm-classname-aliased-shared-jointable-source"
blocked-by: null
---

## Context

Surfaced while converting `eager.test.ts`'s habtm cluster to canonical
models (RFC 0019 `assoc-eager-split-canonical-habtm`). Rails'
`test_eager_with_multiple_associations_with_same_table_has_many_and_habtm`
(vendor/rails/activerecord/test/cases/associations/eager_test.rb:1028)
iterates `[Author, Category]` eager-loading the post-type associations
`[:posts, :other_posts, :special_posts]`. On `Category`, `other_posts` and
`special_posts` are HABTM aliases for `posts` over the **same** join table
`categories_posts` with `class_name: "Post"`:

```ruby
has_and_belongs_to_many :posts
has_and_belongs_to_many :special_posts, class_name: "Post"
has_and_belongs_to_many :other_posts,  class_name: "Post"
```

The trails HABTM builder
(`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts`)
and `createHabtmJoinModel` (`associations.ts:2498`) derive the target FK and
the source `belongsTo` name from the **association name**
(`habtmTargetFk(name, options)` → `other_post_id`; `singularize(name)` →
`otherPost`) instead of from the resolved **class name** (`post_id` / `post`).
So `Category.includes(:other_posts)` preloads through a join model whose source
`belongsTo` is `otherPost` against a non-existent `categories_posts.other_post_id`
column, and the preloader fails with
`AssociationNotFoundError: Association named 'otherPost' was not found on HABTM_Posts`.

Rails derives the association_foreign_key from the class name
(`active_record/reflection.rb` → `derive_join_table` /
`AssociationReflection#association_foreign_key` uses `klass.name`), so all three
aliases share `post_id`/`post` and reuse the join.

## Acceptance criteria

- [ ] HABTM target FK and join-model source name derive from the resolved
      target class name (`post` / `post_id`) rather than the association name,
      so `class_name:`-aliased HABTM associations over a shared join table
      (`Category.other_posts`, `Category.special_posts`) preload correctly.
- [ ] Un-skip `eager.test.ts` >
      `eager with multiple associations with same table has many and habtm`
      (currently `it.skip` with a pointer to this story) and confirm it passes.
- [ ] No regression in existing habtm tests
      (`packages/activerecord/src/associations/habtm.test.ts`,
      `eager.test.ts`).
