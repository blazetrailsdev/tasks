---
title: "assoc-join-model-canonical-wave5"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
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

Follow-up to `assoc-join-model-canonical-wave4` (RFC 0019). Waves 1-4 ported the
read-only, mutating-polymorphic, eager/custom-key, self-ref/STI/preload groups
of `packages/activerecord/src/associations/join-model.test.ts`. The file is
canonical (no `defineSchema`, off the exclude list), but a tail of Rails tests
in `vendor/rails/activerecord/test/cases/associations/join_model_test.rb`
remains unported. Port them word-for-word onto canonical fixtures/models.

Remaining Rails tests (names verbatim):

- `test_has_many_distinct_through_count`
- `test_polymorphic_has_many_going_through_join_model` (+ `_with_find`,
  `_with_include_on_source_reflection`, `..._with_find`,
  `_with_custom_select_and_joins`, `_with_custom_foreign_key`)
- `test_include_has_many_through_polymorphic_has_many`
- `test_eager_load_has_many_through_has_many` (+ `_with_conditions`)
- `test_eager_belongs_to_and_has_one_not_singularized`
- `test_associating_unsaved_records_with_has_many_through`
- `test_has_many_through_collection_size_doesnt_load_target_if_not_loaded`
- `test_has_many_through_collection_size_uses_counter_cache_if_it_exists`
- `test_adding_to_has_many_through_should_return_self`
- `test_has_many_through_sum_uses_calculations`
- `test_calculations_on_has_many_through_should_disambiguate_fields` (+ `..._unless_necessary`)
- `test_preload_polymorphic_has_many_through`
- `test_proper_error_message_for_eager_load_and_includes_association_errors`
- `test_eager_association_with_scope_with_string_joins`

## Acceptance criteria

- [ ] All listed tests ported word-for-word; names verbatim from Rails.
- [ ] No `defineSchema`; canonical fixtures + `name(:label)` lookups only.
- [ ] `pnpm vitest run .../join-model.test.ts` passes; genuine trails gaps are
      `it.skip`'d with a tracked convergence story (RFC 0023).
- [ ] 500 LOC ceiling; single PR off main.
