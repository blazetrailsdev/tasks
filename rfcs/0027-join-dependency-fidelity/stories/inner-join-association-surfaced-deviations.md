---
title: "inner-join-association-surfaced-deviations"
status: ready
updated: 2026-06-30
rfc: "0027-join-dependency-fidelity"
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

Surfaced while porting `inner-join-association.test.ts` to a faithful Rails port
(`vendor/rails/activerecord/test/cases/associations/inner_join_association_test.rb`)
under RFC 0048 (redo-associations-faithful-port). Four upstream test cases are
ported verbatim but currently `it.skip`ped (tracked-pending-convergence) because
they exercise join behaviors trails does not yet match Rails on. Each gap is
independent; converge and un-skip the corresponding test as it lands.

## Gaps (each maps to one skipped test)

1. **`test_deduplicate_joins`** — merging a relation into itself does not
   deduplicate identical Arel join nodes, so the `posts` self-join is emitted
   twice and `posts.type` becomes ambiguous. Rails dedupes the join node.

2. **`test_eager_load_with_string_joins`** — `eager_load(:agents)` on a
   self-referential association aliases the `people` self-join differently than
   Rails. Rails seeds the alias_tracker so a user-supplied string join can
   reference `agents_people_2`; trails emits a non-matching alias →
   `no such column: agents_people_2.id`.

3. **`test_eager_load_with_arel_joins`** — same self-referential eager_load
   aliasing gap as (2), via a user-supplied Arel `OuterJoin` (collides on
   `agents_people.primary_contact_id`).

4. **`joins a has_many association with a composite foreign key`** —
   `ShardedBlogPost.joins(:comments)` (composite `foreignKey: [blog_id,
blog_post_id]`) is rejected by the join-dependency builder
   ("Association named 'comments' was not found"). The belongs_to composite-FK
   join (`ShardedComment.joins(:blog_post)`) works; only the has_many side fails.

## Acceptance criteria

- [ ] Fix each gap in the implementation to match Rails.
- [ ] Un-skip the corresponding `it.skip` in
      `packages/activerecord/src/associations/inner-join-association.test.ts`
      (test names unchanged) and confirm it passes on sqlite/postgres/mysql.
