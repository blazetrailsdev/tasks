---
title: "Relation#firstOrInitialize on an association relation must apply polymorphic scope_for_create"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-19T01:22:20Z"
assignee: "assoc-relation-firstorinit-applies-polymorphic-scope"
blocked-by: null
---

## Context

Surfaced during `assoc-has-many-describes-wave4` (PR #3568, converting the
polymorphic `HasManyAssociationsTest` describe in
`packages/activerecord/src/associations/has-many-associations.test.ts`).

For Rails' `post.taggings.where(tag: tag).first_or_initialize` (a polymorphic
`has_many :taggings, as: :taggable`), the built record must receive BOTH:

- `tag_id` from the relation's `where_values_hash` (the chained `.where`), and
- `taggable_type = "Post"` / `taggable_id` from the association's
  `scope_for_create` (the polymorphic `as:` type/FK columns).

In trails, the two code paths diverge:

- `CollectionProxy#firstOrInitialize` (`associations/collection-proxy.ts:2461`)
  builds via `this.build(conditions)` → `_buildRaw`, which DOES set the
  polymorphic `as` type column, but does NOT translate association-key
  conditions (`{ tag }`) into `tag_id`.
- `Relation#firstOrInitialize` (`relation.ts:3862`) builds via
  `new modelClass({ ...this.scopeForCreate(), ...extra })`, which DOES fold
  `where_values_hash` (so `tag_id` lands) but does NOT apply the association's
  polymorphic scope-for-create, so `taggable_type` comes back `null`.

So `…taggings.where({ tag }).firstOrInitialize()` (the relation path) sets
`tag_id` but leaves `taggable_type` null; the test had to call
`…taggings.firstOrInitialize({ tag })` (the proxy path) to get both. Rails gets
both from one expression because the association relation carries the
`scope_for_create` (FK + polymorphic type) into `first_or_initialize`.

## Acceptance criteria

- [ ] An association-scoped relation (from `proxy.where(...)`) applies the
      association's `scope_for_create` (polymorphic `as` type + FK columns)
      when building via `firstOrInitialize` / `firstOrCreate`, so
      `post.taggings.where(tag: tag).first_or_initialize` sets both `tag_id`
      AND `taggable_type`.
- [ ] Add/adjust a test mirroring Rails
      `test_attributes_are_set_when_initialized_from_polymorphic_has_many_null_relationship`
      using the chained `.where(...).firstOrInitialize()` form.
- [ ] Passes on sqlite + postgres.
