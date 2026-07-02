---
title: "wire inverse_of on canonical Author.posts/Post.author for eager-load object identity"
status: done
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 4249
claim: "2026-07-02T04:08:22Z"
assignee: "eager-inverse-of-object-identity"
blocked-by: null
---

## Context

Exposed by PR #4235 (eager.test.ts wave A). The Rails test
`test_should_work_inverse_of_with_eager_load` (eager_test.rb:64-68) asserts:

```ruby
author = authors(:david)
assert_same author, author.posts.first.author
assert_same author, author.posts.eager_load(:comments).first.author
```

`assert_same` tests Ruby object identity — the `post.author` loaded via eager loading
must be the **exact same in-memory object** as the original `author`, not a new instance
with the same id. This requires `inverse_of` to be wired on `Author.hasMany("posts")` /
`Post.belongsTo("author")` so the eager-loader can back-assign the already-loaded Author.

In trails, `Author.posts` and `Post.author` do not have `inverseOf` set on the canonical
models (`packages/activerecord/src/test-helpers/models/author.ts`,
`packages/activerecord/src/test-helpers/models/post.ts`). As a result `post.author`
returns a freshly-fetched object — failing the identity check.

The wave A PR shipped a bespoke fallback (EagerInvParent/EagerInvChild that tests includes
without inverse_of), preserving the passing test count while deferring the real fix.

## Acceptance criteria

- `Author.hasMany("posts")` gains `inverseOf: "author"` and `Post.belongsTo("author")`
  gains `inverseOf: "posts"` in the canonical test models.
- `should work inverse of with eager load` is converted to use canonical Author/Post
  fixtures and the bespoke EagerInvParent/EagerInvChild class is removed from that test.
- `assert_same` semantics verified: the `post.author` object returned inside
  `assertNoQueries` is `===` to the `author` variable (or trails' equivalent identity check).
