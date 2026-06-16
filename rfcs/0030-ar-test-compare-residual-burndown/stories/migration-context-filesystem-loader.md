---
title: "migration-context-filesystem-loader"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`migration_test.rb` → `migration.test.ts`: the test `name collision across dbs`
(Rails `test_name_collision_across_dbs`, vendor/rails .../migration_test.rb:122)
remains `it.skip` after RFC 0030 story `c4-migration-column-def-tail`.

Rails:

```ruby
migrations_path = MIGRATIONS_ROOT + "/valid"
migrator = ActiveRecord::MigrationContext.new(migrations_path)
migrator.up
assert_column Person, :last_name
```

It constructs a `MigrationContext` from a **directory of versioned migration
files**, runs `up`, and asserts the `Person` model gained `last_name`.

trails' `MigrationContext` (packages/activerecord/src/migration.ts:1659) is an
adapter-backed DDL recorder (`new MigrationContext(adapter)`, createTable/addColumn
tracked in maps) — it does not load migration files from a filesystem path nor
track versions the way `Migrator` does. There is no faithful way to load the
`/valid` fixture migrations through it today.

## Acceptance criteria

- [ ] `MigrationContext` (or an equivalent) can be constructed from a migrations
      directory path and load/run versioned migration files (Rails parity).
- [ ] Un-skip `name collision across dbs` in `migration.test.ts`, mirroring the
      Rails test (canonical `Person` model + the `/valid` migrations fixture).
- [ ] No new gate-mismatches for `migration.test.ts`.
