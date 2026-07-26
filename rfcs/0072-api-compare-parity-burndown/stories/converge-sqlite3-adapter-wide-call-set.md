---
title: "converge-sqlite3-adapter-wide-call-set"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. 37 entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/sqlite3-adapter.json`
where the trails body (`connection-adapters/sqlite3-adapter.ts` and
`connection-adapters/sqlite3/schema-statements.ts`) omits a call Rails makes.

Anchors:
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`
and `.../sqlite3/schema_statements.rb`.

- Transaction entry: `begin_db_transaction`, `begin_deferred_transaction`,
  `begin_isolated_db_transaction` all drop `internal_begin_transaction` — Rails
  funnels the three through one private primitive; trails inlines each.
- Foreign-key helpers: `add_foreign_key` drops `assert_valid_deferrable` and
  `strip_table_name_prefix_and_suffix`; `remove_foreign_key` drops `all?`,
  `delete`, `except`, `foreign_key_exists?`, `pluralize`, `slice`,
  `strip_table_name_prefix_and_suffix`. The dropped `assert_valid_deferrable`
  is a validation gap, not a restructuring — a bad `:deferrable` value should
  raise.
- Check constraints: `remove_check_constraint` drops `check_constraint_exists?`,
  `check_constraint_for!`, `delete_if`, `foreign_keys`; `check_constraints`
  drops `map`, `query_value`, `quote`.
- Introspection/exec primitives: `indexes` drops `filter_map`,
  `internal_exec_query`, `query_value`, `quote`; `virtual_table_exists?` drops
  `any?`, `data_source_sql`, `query_values`; `explain` drops
  `internal_exec_query`, `new`, `pp`, `to_sql`.
- Quoting/casting: `quote_string` drops `quote`; `quoted_time` drops `change`;
  `quote_default_expression` drops `call`, `match?`; `type_cast` drops `encode`;
  `returning_column_values` drops `first`.

## Acceptance criteria

- Converge the three transaction-entry bodies onto a single ported
  `internalBeginTransaction` primitive, matching Rails' structure.
- Restore `assertValidDeferrable` in `addForeignKey` and the
  `checkConstraintExists?` / `checkConstraintFor!` path in
  `removeCheckConstraint`, with regression tests that fail on the current
  implementation.
- Route introspection through the ported `internalExecQuery` / `queryValue` /
  `queryValues` primitives where the Rails body does.
- `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/sqlite3/`.

Larger than one PR: ship the transaction-entry + foreign-key/check-constraint
half first and register the introspection/quoting half as a follow-up story
rather than exceeding 500 LOC.
