---
title: "through-source-reflection-scope-not-merged"
status: ready
updated: 2026-06-18
rfc: "0040-through-association-source-convergence"
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
`packages/activerecord/src/associations/join-model.test.ts` (wave 4, RFC 0019).
`test_has_many_through_uses_conditions_specified_on_the_has_many_association`
is `it.skip`'d there.

`Author.has_many :nonexistent_comments, through: :posts` resolves its source to
`Post.has_many :nonexistent_comments, -> { where("comments.id < 0") }`. Rails
merges that source reflection's scope into the through query, so
`author.nonexistent_comments` is empty. trails resolves the source reflection
(SQL joins comments→posts correctly) but drops the source scope: the generated
SQL is

    SELECT "comments".* FROM "comments"
    INNER JOIN "posts" ON "comments"."post_id" = "posts"."id"
    WHERE "posts"."author_id" = 1

with no `comments.id < 0` predicate, so it returns all 11 of david's comments
instead of 0. (Verified standalone: `post.nonexistent_comments` is 0 — the
direct source scope works; only the through-merge drops it.)

## Acceptance criteria

- [ ] has_many :through merges the source reflection's scope (WHERE) into the
      through query.
- [ ] Un-skip `has many through uses conditions specified on the has many association`
      in join-model.test.ts.
