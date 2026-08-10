---
title: "test: port columns_test.rb's change_column/change_column_default/null cluster"
status: done
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 5571
claim: "2026-07-29T19:16:13Z"
assignee: "port-columns-test-change-column-cluster"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/migration/columns.test.ts` holds `test_change_column`
(columns_test.rb:181-204) but none of the surrounding `change_column` /
`change_column_default` / `change_column_null` cluster, which is the single
largest block of the file's 28 remaining unported cases.

Scope — columns_test.rb:157-361:

- `test_change_type_of_not_null_column` (:157-165)
- `test_change_column_nullability` (:167-179)
- `test_change_column_with_nil_default` (:216-224)
- `test_change_column_to_drop_default_with_null_false` (:226-234)
- `test_change_column_with_new_default` (:236-243)
- `test_change_column_with_custom_index_name` (:245-253)
- `test_change_column_with_long_index_name` (:255-264)
- `test_change_column_default` (:266-271)
- `test_change_column_default_to_null` (:273-278)
- `test_change_column_default_to_null_with_not_null` (:280-291)
- `test_change_column_default_with_from_and_to` (:293-298)
- `test_change_column_default_preserves_existing_column_default_function`
  (:300-312, `supports_default_expression?`-gated)
- `test_change_column_default_supports_default_function_with_concatenation_operator`
  (:314-321, PostgreSQL-only)
- `test_change_column_null_false` (:323-330)
- `test_change_column_null_true` (:332-339)
- `test_change_column_null_with_non_boolean_arguments_raises` (:341-347)
- `test_change_column_null_does_not_change_default_functions` (:349-361)

Setup/teardown and the `TestModel` host already exist in the file. Larger than
one PR at the 500 LOC ceiling — split at the `change_column_default` boundary
(:266) and register the second half as its own story rather than fanning out.

## Acceptance criteria

- [ ] The cases above ported with Rails-verbatim test names and their
      adapter/feature gates (`supports_default_expression?`, PostgreSQL-only
      concatenation-operator case) preserved.
- [ ] Green on all three adapters; `parity:test` missing count drops by the
      number shipped.
