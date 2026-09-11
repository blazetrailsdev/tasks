---
title: "Port FixtureSet's instance form and all_loaded_fixtures"
status: ready
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
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

Rails' `ActiveRecord::FixtureSet` is an instantiable per-set object:
`FixtureSet.new(connection, name, class_name, path, config)`
(`vendor/rails/activerecord/lib/active_record/fixtures.rb`, `def initialize`)
exposes `#table_name`, `#table_rows`, `#model_class`, and loaded sets are kept in
the `FixtureSet.all_loaded_fixtures` registry (`cattr_accessor :all_loaded_fixtures`).

trails' `FixtureSet` (`packages/activerecord/src/fixtures.ts`, `class FixtureSet`)
is static-only: no constructor, no per-set object, no `allLoadedFixtures`. That
keeps these `fixtures_test.rb` cases excluded in
`scripts/parity/unported-files/unscoped.ts`:

- `CustomNameForFixtureOrModelTest#test_table_name_is_defined_in_the_model`
  (`fixtures_test.rb:1520-1523`, reads `all_loaded_fixtures["admin/randomly_named_a9"].table_name`)
- `FixturesTest` "empty yaml fixture" / "... with a comment in it" (`:522,:526`)
- `HasManyThroughFixture` table_rows cases (`:668,:687,:695`)

## Acceptance criteria

- [ ] `FixtureSet` gains the Rails instance form (constructor, `tableName`,
      `tableRows`, `modelClass`) and a `FixtureSet.allLoadedFixtures` registry
      populated by `createFixtures`, mirroring `fixtures.rb`.
- [ ] "table name is defined in the model" is ported in `fixtures.test.ts` and
      its exclusion row deleted; the other rows above are converged where the
      instance form was their only blocker.
