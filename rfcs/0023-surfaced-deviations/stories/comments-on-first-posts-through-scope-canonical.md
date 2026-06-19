---
title: "Converge comments_on_first_posts through-scope tests onto canonical models"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3657
claim: "2026-06-19T16:36:32Z"
assignee: "comments-on-first-posts-through-scope-canonical"
blocked-by: null
---

## Context

While converging `author-first-posts-missing-scope` (PR #3517) onto the
canonical `Author` / `FirstPost` models, two sibling tests in
`packages/activerecord/src/associations/has-many-through-associations.test.ts`
were found still standing on bespoke models instead of the canonical
`Author#commentsOnFirstPosts` through-association (which runs through
`firstPosts` -> `FirstPost`, whose `default_scope { where(id: 1) }` is the
thing under test):

- `through scope is affected by unscoping` (line 7039) — Rails:
  `FirstPost.unscoped { author.comments_on_first_posts }` returns all comments.
  TS uses bespoke `TsuPost`/`TsuComment`/`TsuAuthor` and never exercises an
  `unscoped` block on the source model; it just compares a manual unscoped
  query to the scoped association.
- `through scope isnt affected by scoping` (line 7104) — Rails:
  `FirstPost.where(id: 2).scoping { author.comments_on_first_posts.reset }`.
  TS uses bespoke `TsiPost`/`TsiComment`/`TsiAuthor` and asserts a query
  against itself (`scopedResult` == `expected`, both the same call) — it never
  opens a `scoping` block, so the behavior named by the test is not tested.

Rails source: through-association tests referencing `comments_on_first_posts`;
models `author.rb:74` (`has_many :comments_on_first_posts, -> { order(...) },
through: :first_posts, source: :comments`) and `post.rb:246-253` (`FirstPost`
default scope). The canonical `Author#commentsOnFirstPosts` already exists
(`test-helpers/models/author.ts`).

## Acceptance criteria

- [x] Port `through scope is affected by unscoping` onto canonical
      `Author#commentsOnFirstPosts` with a real `FirstPost.unscoped { ... }`
      block, asserting it returns the full comment set.
- [x] Port `through scope isnt affected by scoping` onto canonical models with
      a real `FirstPost.where(id: 2).scoping { ... }` block (or the trails
      equivalent), asserting the through result is unaffected by the scoping
      block.
- [x] Remove the bespoke `Tsu*` / `Tsi*` model definitions for these two tests.
- [x] Verify behavior against the corresponding Rails tests; test names match
      Rails verbatim.
- [x] Confirm `test:compare` delta for the file is non-negative.
