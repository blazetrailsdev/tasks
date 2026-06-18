---
title: "join-model.test.ts → canonical: eager/include + custom-key (wave 3)"
status: in-progress
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["assoc-join-model-canonical"]
deps-rfc: []
est-loc: 480
priority: null
pr: 3591
claim: "2026-06-18T15:22:08Z"
assignee: "assoc-join-model-canonical-wave3"
blocked-by: null
---

## Context

Wave 3 of the canonical-schema conversion of
`packages/activerecord/src/associations/join-model.test.ts` (RFC 0019).
Wave 1 ported read-only has_many :through; wave 2 ports mutating polymorphic.

This wave ports the **eager-load / include + has_many_through_has_many +
custom-key** tests, word-for-word from
`vendor/rails/activerecord/test/cases/associations/join_model_test.rb`:

- `test_include_has_many_through`, `test_include_polymorphic_has_one`,
  `test_include_polymorphic_has_one_defined_in_abstract_parent`,
  `test_include_polymorphic_has_many_through`, `test_include_polymorphic_has_many`
- `test_has_many_with_piggyback`, `test_create_through_has_many_with_piggyback`
- `test_has_many_going_through_join_model_with_custom_foreign_key` /
  `_with_custom_primary_key` /
  `test_has_many_going_through_polymorphic_join_model_with_custom_primary_key`
- `test_has_many_through_with_custom_primary_key_on_belongs_to_source` /
  `_on_has_many_source`
- `test_has_many_polymorphic`, `test_has_many_polymorphic_with_source_type`,
  `test_eager_has_many_polymorphic_with_source_type`,
  `test_has_many_polymorphic_associations_merges_through_scope`
- `test_has_many_through_has_many_find_all` / `_with_custom_class` /
  `_find_first` / `_find_conditions` / `_find_by_id`
- `test_has_many_through_polymorphic_has_one` / `_has_many`
- `test_unavailable_through_reflection`, `test_exceptions_have_suggestions_for_fix`,
  `test_has_many_through_join_model_with_conditions`

NOTE: `posts(:welcome).tags.first` then `assert_no_queries { tag.tagging }`
(test_polymorphic_has_many_going_through_join_model) was deferred from wave 1 —
trails does not cache the through-source `tagging` on the loaded tag (1 extra
query). Include it here only if the JD through-source caching gap is closed;
otherwise carry it forward with a tracked note.

## Acceptance criteria

- [ ] Test bodies ported word-for-word; test names verbatim from Rails.
- [ ] No `defineSchema`; canonical fixtures + `name(:label)` lookups only.
- [ ] `pnpm vitest run .../join-model.test.ts` passes; `pnpm lint` clean.
- [ ] 500 LOC ceiling, single PR off main.
