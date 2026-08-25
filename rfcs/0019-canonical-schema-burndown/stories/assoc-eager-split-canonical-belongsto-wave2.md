---
title: "assoc-eager-split-canonical-belongsto-wave2"
status: done
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3476
claim: "2026-06-16T16:13:35Z"
assignee: "assoc-eager-split-canonical-belongsto-wave2"
blocked-by: null
---

## Context

Continuation of `assoc-eager-split-canonical` (RFC 0019). The first wave (PR for
`assoc-eager-split-canonical-2d05`) converged the `Comment.includes(:post)`
belongs*to limit/conditions cluster onto canonical comments/posts fixtures and
removed the bespoke `eager_limit*_`/`eager*lc*_`/`eager*lo*_`/`eager*loc*_`/
`eager*loca*_`/`eager*bt_csu*_`/`eager*cond*\*` inline tables.

The remaining bespoke belongs_to tests in `packages/activerecord/src/associations/eager.test.ts`
still construct ad-hoc models + inline `TEST_SCHEMA` tables:

- "eager association loading with belongs to and foreign keys" — Rails
  `eager_test.rb:438` uses `Pet.all.merge!(includes: :owner)` (4 pets). Needs
  canonical pets/owner fixtures.
- "...belongs to inferred foreign key from association name" — Rails:529 uses
  `AuthorFavorite.includes(:favorite_author)`.
- "...belongs to and conditions string with quoted table name" — Rails:499.
- "...belongs to and order string with unquoted/quoted table name" — Rails:505/511.
- "...belongs to and limit and multiple associations" — Rails:517,
  `Post.all.merge!(includes: [:author, :very_special_comment], limit: 1, order: "posts.id")`.
- "...belongs to and limit and offset and multiple associations" — Rails:523.

The `Post.author`/`Post.verySpecialComment` and `Comment.post` canonical
associations already exist; the multiple-associations tests can move into the
existing canonical-fixture `EagerAssociationTest` block (authors/posts/comments).

## Acceptance criteria

- [ ] Open `eager_test.rb` first; port each body word-for-word, test names unchanged.
- [ ] Convert the belongs_to tests above to canonical registry models + fixtures;
      remove their bespoke inline `TEST_SCHEMA` entries.
- [ ] `pnpm lint` clean, no eslint-disable; file may stay in exclude until the
      final wave removes the last `defineSchema`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/eager.test.ts` passes.
- [ ] ≤300 LOC; single PR from main, not stacked.
