---
title: "Port de-stubbed persistence Rails tests (cpk/becomes-sti/readonly/uuid) to canonical"
status: ready
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3817 (persistence-test-canonical-wave6) deleted 36 zero-assertion stub
tests (`expect(true).toBe(true)`) from `packages/activerecord/src/persistence.test.ts`
per the no-stubs rule, dropping persistence test:compare from 160 -> 124
(-36 matched names). The stubs carried real Rails test names from
`vendor/rails/activerecord/test/cases/persistence_test.rb` but asserted nothing,
so the named Rails behaviors are now genuinely UNCOVERED (not merely renamed).

These fall into clusters that need real canonical implementations to restore the
matched names honestly:

- composite primary key destroy/update: `test_destroy_with_single_composite_primary_key`,
  `test_destroy_with_multiple_composite_primary_keys`,
  `test_destroy_with_invalid_ids_for_a_model_that_expects_composite_keys`,
  `test_destroy_for_a_failed_to_destroy_cpk_record`,
  `populates_non_primary_key_autoincremented_column`,
  `populates_autoincremented_id_pk_regardless_of_its_position_in_columns_list`.
- `becomes` STI variants: `test_becomes_after_reload_schema_from_cache`,
  `test_becomes_wont_break_mutation_tracking`, `test_becomes_includes_changed_attributes`,
  `test_becomes_initializes_missing_attributes`, `test_becomes_keeps_extra_attributes`,
  `test_becomes_default_sti_subclass`, `test_preserve_original_sti_type`,
  `test_update_sti_subclass_type`.
- readonly + updated_at columns: `test_update_attribute_for_readonly_attribute`,
  `test_update_columns_should_not_modify_updated_at`,
  `test_update_columns_with_model_having_primary_key_other_than_id`,
  `test_update_attribute_for_aborted_callback`, `test_reset_column_information_resets_children`.
- uuid pk (postgres): `test_create_model_with_uuid_pk_populates_id`,
  `test_create_model_with_custom_named_uuid_pk_populates_id`.

## Acceptance criteria

- [ ] For each cluster, add genuine canonical tests (canonical models + fixtures,
      Rails names verbatim) that actually exercise the behavior, restoring the
      test:compare matched names lost in PR #3817. Implement any missing
      persistence.ts support required (or register a separate impl story if a
      feature is genuinely absent).
- [ ] No `expect(true).toBe(true)` stubs reintroduced.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
