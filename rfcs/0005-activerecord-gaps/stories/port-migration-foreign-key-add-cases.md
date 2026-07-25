---
title: "Port the add_foreign_key half of migration/foreign_key_test.rb"
status: ready
updated: 2026-07-25
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb` has no
trails counterpart — `find packages/activerecord/src -name '*foreign*'` turns up
only `associations/foreign-association.ts`,
`adapters/postgresql/foreign-table.test.ts`, and two association-side tests.
`ActiveRecord::Migration::ForeignKeyTest` (`foreign_key_test.rb:168` onward) is
entirely unported, so its ~40 `test_add_foreign_key_*` /
`test_remove_foreign_key_*` cases count as missing in `test:compare`.

PR #5287 (RFC 0029) converted the `addForeignKey` + `ifNotExists` cases in
`connection-adapters/abstract/schema-statements-on-adapter.test.ts` to the
ambient connection and, in doing so, built a `withRocketTables` helper that
already mirrors that class's setup/teardown exactly
(`foreign_key_test.rb:178-194`: `create_table "rockets", force: true` /
`create_table "astronauts", force: true` with
`t.references :rocket, type: :bigint` + `t.references :favorite_rocket`, and an
`if_exists: true` teardown). Only the `if_not_exists` behavior is covered there,
under the schema-statements file's own test names — the rest of the class has no
home.

Scope this story to the **`add_foreign_key` half** of the class
(`foreign_key_test.rb:209-330` — `test_add_foreign_key_inferes_column`,
`_with_column`, `_with_non_standard_primary_key`, the `on_delete` / `on_update`
variants, `_with_if_not_exists_*`). The `remove_foreign_key` half and the
schema-dumper cases are a separate story; splitting keeps this under the 500-LOC
ceiling.

Rails' names are `foreign_key_test.rb`, so the trails file is
`packages/activerecord/src/migration/foreign-key.test.ts`. Lift
`withRocketTables` out of `schema-statements-on-adapter.test.ts` as the shared
setup rather than re-deriving it.

## Acceptance criteria

- [ ] `packages/activerecord/src/migration/foreign-key.test.ts` exists, driven by
      the ambient connection (`Base.leaseConnection()`, Rails'
      `ActiveRecord::Base.lease_connection`) and Rails' rockets/astronauts setup.
- [ ] The `add_foreign_key` cases of `foreign_key_test.rb:209-330` are ported
      with test names matching Rails verbatim, honoring the
      `unless current_adapter?(:SQLite3Adapter)` FK-name guards.
- [ ] `withRocketTables` is shared, not duplicated — the existing
      `schema-statements-on-adapter.test.ts` cases keep working off it.
- [ ] `test:compare` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
