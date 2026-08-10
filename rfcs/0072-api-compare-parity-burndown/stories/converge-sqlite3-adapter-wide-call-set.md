---
title: "converge-sqlite3-adapter-wide-call-set"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5913
claim: "2026-08-02T19:19:25Z"
assignee: "converge-sqlite3-adapter-wide-call-set"
blocked-by: null
closed-reason: null
---

## Context

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. **31** entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/sqlite3-adapter.json`
where the trails body (`connection-adapters/sqlite3-adapter.ts` and
`connection-adapters/sqlite3/schema-statements.ts`) omits a call Rails makes.

Anchors:
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`
and `.../sqlite3/schema_statements.rb`.

**Re-verified 2026-07-30, and split.** The count was 37 when written; it is 31
now, and the `add_foreign_key` arm has already converged — `assertValidDeferrable`
is called at `sqlite3-adapter.ts:2186` and both of its baseline entries are gone.
`remove_foreign_key` is down from 7 entries to 4. This story now owns the
**transaction-entry + foreign-key / check-constraint half only** (14 entries);
the introspection/quoting half (17 entries) moved to
`converge-sqlite3-introspection-and-quoting-call-set`.

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
- Restore the `checkConstraintExists?` / `checkConstraintFor!` path in
  `removeCheckConstraint`, with a regression test that fails on the current
  implementation. (`assertValidDeferrable` in `addForeignKey` is already done —
  do not redo it.)
- Converge the 4 remaining `remove_foreign_key` entries (`all?`, `delete`,
  `except`, `slice` — `foreign_key_exists?`, `pluralize` and
  `strip_table_name_prefix_and_suffix` have already cleared).
- Introspection and quoting are OUT of scope — see the successor story.
- `pnpm parity:api:calls` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/sqlite3/`.

Split executed 2026-07-30: the introspection/quoting half is
`converge-sqlite3-introspection-and-quoting-call-set`. The two touch different
bodies in the same two files — sequence them, do not run them concurrently.
