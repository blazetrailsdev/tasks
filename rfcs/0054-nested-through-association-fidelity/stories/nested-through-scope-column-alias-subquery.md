---
title: "nested-through scope referencing intermediate table column fails in subquery context"
status: done
updated: 2026-07-06
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 4663
claim: "2026-07-06T10:06:22Z"
assignee: "nested-through-scope-column-alias-subquery"
blocked-by: null
---

## Context

Surfaced during RFC 0019 canonical-schema burndown of
`packages/activerecord/src/associations/nested-through-associations.test.ts`.

Three Rails tests use scoped nested-through associations where the scope
references a column on an intermediate table that ends up in a subquery context:

- `test_nested_has_many_through_with_conditions_on_source_associations`
  (`author.miscPostFirstBlueTags_2.toArray()`) — direct load errors:
  `no such column: posts.title`
- `test_nested_has_many_through_with_conditions_on_source_associations_preload`
  (preloading `miscPostFirstBlueTags_2`) — preload errors:
  `no such column: taggings.comment`
- `test_through_association_preload_doesnt_reset_source_association_if_already_preloaded`
  (preloading `posts: :first_blue_tags_2, misc_post_first_blue_tags_2: {}`) — same preload error

The root cause: when a scope on the source reflection references
`posts.title` (a condition on the through-table), the chain-walker emits
a subquery for the intermediate step and the column reference becomes
unresolvable because it is outside the outer query's FROM clause. Rails
resolves this via `references(:posts)` / Arel table aliasing in the chain.

Files: `packages/activerecord/src/associations/nested-through-associations.test.ts` (lines 708, 712, 716)
Rails source: `activerecord/test/cases/associations/nested_through_associations_test.rb` lines 558-578
Association: `Author#misc_post_first_blue_tags_2` (scope: `where(taggings: { comment: "first" })`),
`Post#first_blue_tags_2` (scope: `where(posts: { title: "misc by bob" })`)

## Acceptance criteria

- `author.miscPostFirstBlueTags_2.toArray()` returns `[tags(:blue)]`
- `Author.includes(:misc_post_first_blue_tags_2).third` preloads correctly without SQL error
- `Author.preload(posts: :first_blue_tags_2, misc_post_first_blue_tags_2: {}).third` works
- The three `it.todo` tests (lines 708, 712, 716) un-skip and pass on all three adapters
