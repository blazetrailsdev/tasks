---
title: "Converge remaining columnsHash() stub cases in migration.test.ts to faithful Rails ports"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-06-30T22:54:48Z"
assignee: "converge-migration-test-columnshash-stubs"
blocked-by: null
---

## Context

PR #4349 (story `converge-migration-test-and-trails-one-schema`) converged the
four byte-size limit cases in `packages/activerecord/src/migration.test.ts` to
faithful Rails ports. While doing so, several OTHER cases in the same file were
found to still be shallow "D-1 partial conversion" stubs: their `it(...)` names
match `vendor/rails/activerecord/test/cases/migration_test.rb` verbatim, but the
bodies declare an ad-hoc `class X extends Base { static { this.attribute(...) } }`
and assert `columnsHash()` shape instead of exercising the Rails behavior
(create_table / add_column / remove_column / table_name_prefix through the live
adapter migration path).

Stub cases identified (line numbers as of PR #4349 merge):

- `add table with decimals` (migration.test.ts:232) ↔ rb `test_add_table_with_decimals` — Rails creates `big_numbers` with many decimal/float/int limit columns and asserts the persisted column precision/scale/limit; the stub only checks an attribute exists.
- `create table with binary column` (migration.test.ts:316) ↔ rb `test_create_table_with_binary_column` — Rails creates a table with `t.binary` (with/without limit) and asserts the column type; stub asserts a string attribute.
- `proper table name on migration` (migration.test.ts:326) ↔ rb `test_proper_table_name_on_migration` — Rails exercises `Migration.new.proper_table_name` with `table_name_prefix`/`suffix` and explicit names; stub asserts `tableName` is a non-empty string.
- `remove column with if not exists not set` (migration.test.ts:336) ↔ rb `test_remove_column_with_if_not_exists_not_set` — Rails adds then removes a column and asserts raise-on-missing; stub asserts a `columnsHash()` entry.
- `add column with if not exists set to true` (migration.test.ts:220) ↔ rb `test_add_column_with_if_not_exists_set_to_true` — verify whether the stub body matches Rails or needs the live add_column path.

(Exclude `instance based migration up`/`down`, which legitimately use a Base
subclass as part of the migration under test — verify before touching.)

## Acceptance criteria

- [ ] Each stub above is converted to a faithful word-for-word port of its
      Rails counterpart, riding canonical schema + Rails' own scratch tables
      via the live `MigrationContext`/`createTable` path (no `columnsHash()`
      shape stubs, no ad-hoc `extends Base` shims).
- [ ] Test names remain verbatim-matched to `migration_test.rb`.
- [ ] Any surfaced impl gap is fixed, or filed under `0023-surfaced-deviations`.
- [ ] test:compare delta non-negative; api:compare unaffected by test-only edits.
- [ ] All-or-nothing per cluster; stay under the 500-LOC PR ceiling (split
      across PRs by sub-cluster if needed, each from main, non-overlapping).
