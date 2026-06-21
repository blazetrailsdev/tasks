---
title: "through-polymorphic-source-applies-type-condition"
status: ready
updated: 2026-06-18
rfc: "0000-through-association-source-convergence"
cluster: null
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

Surfaced by the canonical conversion of
`packages/activerecord/src/associations/join-model.test.ts` (wave 3, RFC 0019).
`test_has_many_through_polymorphic_has_one` and
`test_has_many_through_polymorphic_has_many` are `it.skip`'d there.

When a `has_many :through` walks a polymorphic `as: :taggable` source
(`Post.taggings`), trails omits the `taggable_type = 'Post'` predicate from the
generated SQL. Debug:
`SELECT "taggings".* FROM "taggings" INNER JOIN "posts" ON "taggings"."taggable_id" = "posts"."id" WHERE "posts"."author_id" = 1`
— no `taggable_type` filter — so `author.taggings` / `author.taggings_2` return
every tagging whose `taggable_id` collides with the owner's post ids (Rating /
Item / FakeModel rows leak in: got [1,2,3,4,12,13], expected [1,2]).

## Acceptance criteria

- [ ] Through-association SQL applies the polymorphic `*_type` condition from the
      source reflection.
- [ ] Un-skip `has many through polymorphic has one` / `has many through
polymorphic has many` in join-model.test.ts.
