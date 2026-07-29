---
title: "withPostgresqlDatetimeType drags a PG connection probe onto every lane"
status: draft
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`withPostgresqlDatetimeType` — trails' port of Rails'
`with_postgresql_datetime_type` — lives in
`packages/activerecord/src/adapters/postgresql/test-helper.ts:20`. That module
transitively imports `packages/activerecord/src/support/describe-if-pg.ts`,
which runs a **top-level `await`** that opens a real connection to probe a
PostgreSQL server at module load.

Any lane-neutral test file that needs the helper therefore pays a PG connection
attempt on the sqlite and mysql lanes too. PR #5558 hit this and left
`test_add_column_with_datetime_in_timestamptz_mode`
(`vendor/rails/activerecord/test/cases/migration/change_schema_test.rb:303-316`)
unported rather than drag the probe onto every lane — that case belongs in
`packages/activerecord/src/migration/change-schema.test.ts`, which runs on all
three.

In Rails the helper lives in the postgresql-specific test helper and
`change_schema_test.rb` picks it up because the whole `if
current_adapter?(:PostgreSQLAdapter)` block is only parsed there — Ruby has no
module-load side effect to worry about.

Options: relocate the helper somewhere lane-neutral (it only swaps
`PostgreSQLAdapter.datetimeType`, needing no live server), or make
`describe-if-pg`'s probe lazy.

## Acceptance criteria

- [ ] `withPostgresqlDatetimeType` is importable from a lane-neutral test file
      without triggering a PG connection probe on the sqlite/mysql lanes.
- [ ] `test_add_column_with_datetime_in_timestamptz_mode` is ported into
      `packages/activerecord/src/migration/change-schema.test.ts`, gated to the
      postgres lane, with the name matching Rails verbatim.
- [ ] No new PG connection attempts on the sqlite/mysql lanes (check suite
      startup time does not regress).
- [ ] Green on all three lanes.
