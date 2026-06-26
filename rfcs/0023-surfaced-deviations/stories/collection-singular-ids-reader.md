---
title: "Generate has_many <association>_ids collection reader (collection_singular_ids)"
status: ready
updated: 2026-06-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converging `packages/activerecord/src/associations/eager.test.ts`
preloading cluster to canonical models (PR #4186, story
`assoc-eager-split-canonical-preloading`).

Rails generates a `collection_singular_ids` reader for every `has_many` /
`has_many through` association (e.g. `author.unique_categorized_post_ids`),
returning the collection's primary-key values directly. Rails:
`activerecord/lib/active_record/associations/builder/collection_association.rb`
(`define_readers` adds `def #{name}_ids`), backed by
`CollectionAssociation#ids_reader`.

trails does NOT generate this `<association>Ids` reader. This blocked a
faithful port of the second assertion in
`test_preloading_has_many_through_with_distinct`
(`activerecord/test/cases/associations/eager_test.rb:1342` —
`assert_equal 1, mary.unique_categorized_post_ids.length`). The converged test
substitutes a concrete-identity check on `.target` ids and documents the gap
inline (eager.test.ts, `preloading has many through with distinct`).

## Acceptance criteria

- [ ] `has_many` / `has_many :through` associations expose a generated
      `<association>Ids` reader returning the collection's PK values, matching
      Rails `CollectionAssociation#ids_reader` (uses the loaded target when
      loaded, otherwise a `pluck` of the key — including `distinct` when the
      association scope is distinct).
- [ ] Restore the Rails-faithful second assertion in
      `preloading has many through with distinct`
      (`mary.uniqueCategorizedPostIds.length === 1`) and remove the
      substitute/follow-up comment.
- [ ] api:compare / test:compare delta non-negative.
