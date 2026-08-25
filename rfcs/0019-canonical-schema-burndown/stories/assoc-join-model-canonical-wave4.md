---
title: "join-model.test.ts → canonical: STI/self-ref/preload (wave 4)"
status: done
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["assoc-join-model-canonical"]
deps-rfc: []
est-loc: 490
priority: null
pr: 3593
claim: "2026-06-18T16:24:18Z"
assignee: "assoc-join-model-canonical-wave4"
blocked-by: null
---

## Context

Wave 4 (final) of the canonical-schema conversion of
`packages/activerecord/src/associations/join-model.test.ts` (RFC 0019).
Waves 1-3 ported read-only, mutating-polymorphic, and eager/custom-key groups.

This wave ports the remaining **self-referential, has_many_through mutation,
STI, ordering, and polymorphic-preload** tests word-for-word from
`vendor/rails/activerecord/test/cases/associations/join_model_test.rb` (the
back half of the file, ~line 420 onward):

- `test_has_many_through_has_many_find_all` STI variants,
  `test_self_referential_has_many_through`,
  `test_add_to_self_referential_has_many_through`
- `test_has_many_through_uses_conditions_specified_on_the_has_many_association`,
  `test_has_many_through_uses_correct_attributes`
- `test_create_associate_when_adding_to_has_many_through`,
  `test_delete_associate_when_deleting_from_has_many_through` (+ nonstandard id,
  multiple tags, type-mismatch, integer/string id variants)
- `test_has_many_through_has_many_with_sti`,
  `test_distinct_has_many_through_should_retain_order`
- `test_polymorphic_has_many` / `_has_one` / `_belongs_to`,
  `test_preload_polymorph_many_types`, `test_preload_nil_polymorphic_belongs_to`,
  `test_preload_polymorphic_has_many`, `test_belongs_to_shared_parent`
- `test_has_many_through_include_uses_array_include_after_loaded`,
  `test_has_many_through_include_returns_false_for_non_matching_record_to_verify_scoping`,
  `test_has_many_through_goes_through_all_sti_classes`,
  `test_has_many_inherited`, `test_polymorphic_has_many_going_through_join_model`

Use canonical Vertex/Edge for self-referential, Book/Citation, Aircraft/Engine
(canonical models already exist). Drive STI Post subclasses from
`test-helpers/models/post.ts`.

## Acceptance criteria

- [ ] Test bodies ported word-for-word; test names verbatim from Rails.
- [ ] No `defineSchema`; canonical fixtures + `name(:label)` lookups only.
- [ ] `pnpm vitest run .../join-model.test.ts` passes; `pnpm lint` clean.
- [ ] 500 LOC ceiling, single PR off main. File fully converged, exclude entry
      stays removed.
