---
title: "Port the remaining four InvalidOptionsTest arms (add_column, add_reference, change_column, add_index)"
status: done
updated: 2026-08-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6082
claim: "2026-08-04T18:05:10Z"
assignee: "i18n-time-zone-abbreviation-links"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration::InvalidOptionsTest`
(vendor/rails/activerecord/test/cases/migration/invalid_options_test.rb) has
five tests. PR #6066 ported only `test_create_table_with_invalid_options`
(invalid_options_test.rb:113-123) into
packages/activerecord/src/migration/invalid-options.test.ts; `parity:test`
reports the file as 1 OK / 4 Miss.

The unported arms each assert that an unknown key raises `ArgumentError` with
`assert_valid_keys`' exact message:

- `test_add_reference_with_invalid_options` (invalid_options_test.rb:41-63)
- `test_add_column_with_invalid_options` (invalid_options_test.rb:65-...)
- `test_change_column_with_invalid_options`
- `test_add_index_with_invalid_options`

Rails raises from `add_column`/`add_index` via
`valid_column_definition_options` / `valid_index_options`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1584-1586).
Whether trails' `addColumn`/`addIndex` validate at all is unverified — the
`create_table` path did not before #6066, so expect the same gap.

## Converged shape

- Each remaining Rails test ported into
  `packages/activerecord/src/migration/invalid-options.test.ts` with its
  verbatim Rails name and the adapter-conditional expected message helpers
  Rails builds (invalid_options_test.rb:10-26).
- Wherever a test fails, the fix goes in the implementation: wire the missing
  `assert_valid_keys` call at Rails' call site.

## Acceptance criteria

- [ ] `parity:test` shows 5/5 OK for `migration/invalid_options_test.rb`.
- [ ] Any validation gap the ports surface is closed in the adapter, not in the
      test.
