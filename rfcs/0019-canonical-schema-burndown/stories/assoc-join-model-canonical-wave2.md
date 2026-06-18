---
title: "join-model.test.ts → canonical: mutating polymorphic (wave 2)"
status: in-progress
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["assoc-join-model-canonical"]
deps-rfc: []
est-loc: 450
priority: null
pr: 3586
claim: "2026-06-18T13:52:18Z"
assignee: "assoc-join-model-canonical-wave2"
blocked-by: null
---

## Context

Wave 2 of the canonical-schema conversion of
`packages/activerecord/src/associations/join-model.test.ts` (RFC 0019).
Wave 1 (PR pending) ported the read-only has_many :through tests onto the
canonical Tag/Tagging/Post/Author/Category/Categorization join models +
fixtures and removed the file from the exclude JSON.

This wave ports the **mutating polymorphic** tests, word-for-word from
`vendor/rails/activerecord/test/cases/associations/join_model_test.rb`:

- `test_polymorphic_has_many_create_model_with_inheritance` /
  `_with_custom_base_class` / `test_polymorphic_has_one_create_model_with_inheritance`
- `test_set_polymorphic_has_many`, `test_set_polymorphic_has_one`,
  `test_set_polymorphic_has_one_on_new_record`
- `test_create_polymorphic_has_many_with_scope`,
  `test_create_bang_polymorphic_with_has_many_scope`,
  `test_create_polymorphic_has_one_with_scope`
- `test_delete_polymorphic_has_many_with_delete_all` / `_with_destroy` /
  `_with_nullify`, `test_delete_polymorphic_has_one_with_destroy` / `_with_nullify`
- `test_belongs_to_polymorphic_with_counter_cache`

Drive `posts(:welcome).taggings`, `tags(:misc).taggings.create(...)`,
`create_tagging`, etc. via the canonical models. The `find_post_with_dependency`
helper builds dependent-variant Post subclasses (PostWithHasManyDestroy etc.) —
mirror those Post subclasses (already in `test-helpers/models/post.ts`).

## Acceptance criteria

- [ ] Test bodies ported word-for-word; test names verbatim from Rails.
- [ ] No `defineSchema`; canonical fixtures + `name(:label)` lookups only.
- [ ] `pnpm vitest run .../join-model.test.ts` passes; `pnpm lint` clean.
- [ ] 500 LOC ceiling, single PR off main.
