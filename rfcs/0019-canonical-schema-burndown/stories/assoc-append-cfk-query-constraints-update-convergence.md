---
title: "assoc-append-cfk-query-constraints-update-convergence"
status: done
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3478
claim: "2026-06-16T16:28:30Z"
assignee: "assoc-append-cfk-query-constraints-update-convergence"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave3-convert-canonical` (RFC 0019). The
test `"append composite foreign key has many association"` in
`packages/activerecord/src/associations.test.ts` (AssociationsTest describe) is
the one body in wave 3's sharded/cpk batch that could NOT be converted to the
canonical `Sharded::*` models — it remains on the bespoke CpkOwner/CpkItem
scratch tables (see the NOTE comment above the test).

The faithful Rails port (Rails `test_append_composite_foreign_key_has_many_association`,
`vendor/rails/activerecord/test/cases/associations_test.rb:294`):

    blog_post = sharded_blog_posts(:great_post_blog_one)
    comment = Sharded::Comment.new(body: "Great post! :clap:")
    comment.save
    blog_post.comments << comment

surfaces a persistence divergence: `Sharded::Comment` has
`query_constraints [:blog_id, :id]`. When `comments <<` writes the composite FK
(`blog_id`, `blog_post_id`) onto the already-persisted comment and re-saves, the
trails UPDATE does not persist the new `blog_id`/`blog_post_id` — the DB row keeps
NULLs (verified: in-memory attrs set correctly, DB row stays null). Root cause is
that updating a record whose query_constraints key column (`blog_id`) is itself
changing locates the row by the new (unsaved) key values instead of the persisted
ones (Rails uses `*_in_database`).

## Acceptance criteria

- [ ] Fix the persistence path so an UPDATE on a query_constraints model uses the
      persisted key values when a constraint column changes (Rails `_in_database`).
- [ ] Convert `"append composite foreign key has many association"` to the
      canonical `Sharded::BlogPost` / `Sharded::Comment` models + sharded fixtures,
      word-for-word from associations_test.rb:294; drop the bespoke CpkOwner/CpkItem
      version and the NOTE comment.
- [ ] `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
